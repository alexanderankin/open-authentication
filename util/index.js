/**
 * For securely storing shit
 * 
 * domain: default (domain name of app)
 * encode: default (encodeURIComponent)
 * expires: in a day
 * httpOnly: true (values not visible to client js)
 * maxAge: omitted (convient expiry set in ms from now)
 * path: default ('/')
 * secure: false (whether to restrict to https)
 * signed: yes! should cookie be signed
 * sameSite: see RFC/spec
 */
var cookieOptions = {
  send: {
    expires: new Date(new Date().valueOf() + (1000 * 60 * 60 * 24)),
    httpOnly: true,
    signed: true
  },
  clear: {
    httpOnly: true,
    signed: true
  }
};

module.exports = {
  cookieOptions
};
