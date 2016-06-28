const fdHttpRequest = require('fd-http-request');

/**
 * HTTP status codes which must trigger a redirection
 * Note that this list does not contain all 30x codes, e.g. 300 "Multiple Choices" is not supported here
 */
const REDIRECTION_HTTP_STATUS_CODES = [301, 302, 303, 305, 307, 308];

/**
 * Wrapper for fd-http-request's get() which follows HTTP redirects once
 * This is needed because the Rent Search server has an elusive behaviour when it comes to redirects:
 * - we can't always request in lowercase because "/p/kookboek-huren?search=true&explanation=false" (lowercase) redirects to "/p/Kookboek-huren?search=true&explanation=false" (uppercase)
 * - we can't always request in uppercase because "/p/Statafel-huren?search=true&explanation=false" (uppercase) redirects to "/p/statafel-huren?search=true&explanation=false" (lowercase)
 *
 * @param {string} url	See documentation for fd-http-request's get() method (same for other arguments)
 * @param {function} callback
 * @param {object} opts
 */
function getAndFollow(url, callback, opts) {
	const wrapperCallback = function(res) {
		if (REDIRECTION_HTTP_STATUS_CODES.indexOf(res.status) !== -1) {
			// Response is redirecting us: try once more
			const domainBaseUrl = new RegExp("^https?://[^/]+").exec(url)[0];
			const newRelativeUrl = res.headers.location;
			fdHttpRequest.get(domainBaseUrl + newRelativeUrl, callback, opts);
		}
		else {
			// Normal case: just execute the callback
			callback(res);
		}
	};
	fdHttpRequest.get(url, wrapperCallback, opts);
}

exports.getAndFollow = getAndFollow;
