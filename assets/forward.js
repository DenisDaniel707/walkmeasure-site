// Old addresses forward to the page in data-to, keeping the #section so links
// like /en/#faq still land in the right place. The meta refresh next to it covers
// browsers without JavaScript.
location.replace(document.currentScript.dataset.to + location.hash);
