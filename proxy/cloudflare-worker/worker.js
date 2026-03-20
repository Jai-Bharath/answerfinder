export default {
  /**
   * Cloudflare Worker Fetch Handler
   * Acts as a secure proxy to Groq
   */
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // You should change this to "chrome-extension://your-id" later
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Extension-Key",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const { inputs } = await request.json();

      if (!inputs) {
        return new Response(JSON.stringify({ error: "Missing inputs" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Proxy to Groq
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: inputs }],
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Upstream error", details: data }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Map back to extension format
      const result = {
        generated_text:
          data.choices && data.choices[0]
            ? data.choices[0].message.content
            : "",
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Internal Error", message: err.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  },
};
