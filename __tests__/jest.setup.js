// Prevent expo's winter runtime from installing lazy getters that break Jest.
// The winter runtime (expo/src/winter/runtime.native.ts) replaces Node.js built-ins
// (structuredClone, URL, etc.) with lazy getters that call require() outside of
// Jest's isInsideTestCode scope, causing "import outside of scope" errors.
//
// Since Node.js 17+ already provides all these globals natively, we define them as
// non-configurable before expo can override them with lazy getters.

function freeze(name, value) {
  if (value !== undefined) {
    Object.defineProperty(global, name, {
      value,
      configurable: false,
      writable: false,
      enumerable: true,
    });
  }
}

freeze('structuredClone', global.structuredClone);
freeze('URL', global.URL);
freeze('URLSearchParams', global.URLSearchParams);
freeze('TextDecoder', global.TextDecoder);
freeze('TextEncoder', global.TextEncoder);
freeze('__ExpoImportMetaRegistry', { url: null });
