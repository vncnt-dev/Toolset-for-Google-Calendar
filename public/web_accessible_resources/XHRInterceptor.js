import xhook from './xhook.min.js';
console.info('GC Tools - XHRInterceptor.js loaded!');
let firstEventReceived = false;
try {
  xhook.after(function (req, res) {
    let response = {
      responseURL: res.finalUrl,
      responseText: res.text,
    };
    try {
      // First event is logged to be able to check if the interceptor is working on a basic level
      if (!firstEventReceived) {
        firstEventReceived = true;
        console.info('GC Tools - XHRInterceptor.js: first event received');
      }
      document.dispatchEvent(new CustomEvent('GCT_XMLHttpRequest', { detail: response }));
    } catch (error) {
      console.warn(error);
    }
  });
} catch (error) {
  console.log(error);
}
