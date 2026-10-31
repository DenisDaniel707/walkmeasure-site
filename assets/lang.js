// Visitors in Romania get the Romanian page. "In Romania" is read from the
// device's time zone, as the site asks no server where anyone is. Only on
// arriving from elsewhere: choosing English on the site itself is left alone.
// A file of its own (not inline) so the Content-Security-Policy can allow only
// the site's own scripts.
(function () {
  try {
    var zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    var fromSite = document.referrer.indexOf(location.origin + "/") === 0;
    if (zone === "Europe/Bucharest" && !fromSite) location.replace("ro/");
  } catch (e) {}
})();
