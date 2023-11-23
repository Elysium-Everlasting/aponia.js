declare global {
  namespace Aponia {
    /**
     * Augment the default internal request with SvelteKit's request event.
     * This makes the extra properties available to callback handlers.
     */
    interface InternalRequest extends Omit<import('@sveltejs/kit').RequestEvent, 'cookies'> {}
  }
}

export {}
