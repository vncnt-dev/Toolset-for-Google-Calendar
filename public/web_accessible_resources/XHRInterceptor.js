(function () {
    let oldXHROpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function (method, url) {
        this.addEventListener('load', function () {
            let response = {
                responseURL: this.responseURL,
                responseText: this.responseText,
                /*     status: this.status,
                    statusText : this.statusText, */
            };
            try {
                document.dispatchEvent(new CustomEvent('GCT_XMLHttpRequest', { detail: response }));
            } catch (error) {
                console.warn(error);
            }
        });
        return oldXHROpen.apply(this, arguments);
    };
})();