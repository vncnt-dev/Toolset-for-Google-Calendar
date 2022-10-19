xhook.after(function (req, res) {
    let response = {
        responseURL: res.finalUrl,
        responseText: res.text,
    };
    try {
        document.dispatchEvent(new CustomEvent('GCT_XMLHttpRequest', { detail: response }));
    } catch (error) {
        console.warn(error);
    }
});