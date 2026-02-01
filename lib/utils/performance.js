/**
 * @file performance.js
 * @description Performance monitoring and profiling utilities
 * @module lib/utils/performance
 */

/**
 * Performance timer for measuring operation duration
 */
export class PerformanceTimer {
    constructor(label) {
        this.label = label;
        this.startTime = null;
        this.endTime = null;
    }

    start() {
        this.startTime = performance.now();
        return this;
    }

    end() {
        this.endTime = performance.now();
        return this;
    }

    getDuration() {
        if (!this.startTime || !this.endTime) {
            throw new Error('Timer not started or ended');
        }
        return this.endTime - this.startTime;
    }

    log() {
        const duration = this.getDuration();
        console.log(`[Performance] ${this.label}: ${duration.toFixed(2)}ms`);
        return duration;
    }
}

/**
 * Measure async function execution time
 * @param {Function} fn - Async function to measure
 * @param {string} label - Label for logging
 * @returns {Promise<{result: any, duration: number}>}
 */
export async function measureAsync(fn, label) {
    const timer = new PerformanceTimer(label);
    timer.start();
    const result = await fn();
    timer.end();
    const duration = timer.getDuration();

    if (process.env.NODE_ENV !== 'production') {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
}

/**
 * Measure sync function execution time
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for logging
 * @returns {{result: any, duration: number}}
 */
export function measureSync(fn, label) {
    const timer = new PerformanceTimer(label);
    timer.start();
    const result = fn();
    timer.end();
    const duration = timer.getDuration();

    if (process.env.NODE_ENV !== 'production') {
        console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
}

/**
 * Debounce function calls
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * Throttle function calls
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
