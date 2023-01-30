import { Element } from '@xmpp/xml'

// Self signed for `CN=localhost`, all other fields are blank
// openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -nodes -days 7300
export const CERTIFICATE =
  '-----BEGIN CERTIFICATE-----\nMIIDCTCCAfGgAwIBAgIUFFDGdJ4Ln+E22IggqzN062gdXM0wDQYJKoZIhvcNAQEL\nBQAwFDESMBAGA1UEAwwJbG9jYWxob3N0MB4XDTIyMTIyNzAyMTMxOFoXDTQyMTIy\nMjAyMTMxOFowFDESMBAGA1UEAwwJbG9jYWxob3N0MIIBIjANBgkqhkiG9w0BAQEF\nAAOCAQ8AMIIBCgKCAQEAt3fHs1SX/7u1Ab+nVuZd6NvoM4y9wGPqxIUQ/lu/4ztW\niDdBCRK1lTiI58saiFnGP4KM1Fd3bYnEdFOjB2JMXWkgxVgRyelQx7ihG6W5JOje\nJW4JSKwkX15lM94UHDQotmXoOE1+cFFhHGPA7/ZtQk0I93WuKLG6aX6P4+I+9tMo\nzyse4LRGkzI6C6C/cvp81xxsPJ7lpZ23DdHPfj7OvQJpvuwTYYumkzSIC3jXuMI6\n+G6IwszbLerEwANO2YKQFVrgUN5BjcRYfn9ctmcLP7xgZWRxZ8jvmaeEKfXEJyJx\nRsGQMQCOTNBRXXmmBNo9aSpvXiwU28wyTl3YhNgs6wIDAQABo1MwUTAdBgNVHQ4E\nFgQUoQrez7rUrah1C/nTm7iG6asCJGkwHwYDVR0jBBgwFoAUoQrez7rUrah1C/nT\nm7iG6asCJGkwDwYDVR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEATH5F\n8yHRjyOnE6Ab0YNDBWQRI9J5V6ghj3m+I3dxsPHJQTJmTp7A/jXyog3hyA3Ysyk3\nbomE54Z9G71PoA5ZUik4XqSnzUfnX5gfvJ7MVytK16OejdB/r1pBEcwxowvDidbC\nmwqhVozVhvJPBO29SFSES6mSdGHBOupjObkwZbWod8PYIrnG8PxQug5NA76hHDaU\n00EqJ5ZW4g698hA1rRjS8a/4RcESr/kgbTCL5eITRvA4HEwaChHezWNHsPMq3xTh\nbkYyLrikdF5INs8GHFGxy/A4UifRvqHnBLSjnPyssm/7mvDzzSAJ6FCcIGXUpErH\nETsaUS8O2+EobiunFA==\n-----END CERTIFICATE-----'
export const KEY =
  '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3d8ezVJf/u7UB\nv6dW5l3o2+gzjL3AY+rEhRD+W7/jO1aIN0EJErWVOIjnyxqIWcY/gozUV3dticR0\nU6MHYkxdaSDFWBHJ6VDHuKEbpbkk6N4lbglIrCRfXmUz3hQcNCi2Zeg4TX5wUWEc\nY8Dv9m1CTQj3da4osbppfo/j4j720yjPKx7gtEaTMjoLoL9y+nzXHGw8nuWlnbcN\n0c9+Ps69Amm+7BNhi6aTNIgLeNe4wjr4bojCzNst6sTAA07ZgpAVWuBQ3kGNxFh+\nf1y2Zws/vGBlZHFnyO+Zp4Qp9cQnInFGwZAxAI5M0FFdeaYE2j1pKm9eLBTbzDJO\nXdiE2CzrAgMBAAECggEATsyPZSKMNjZ0w8+BG/3Nj9oDnUBxr1Q63TUZ22WkwQAX\nZmH0+OSkQPcLNiMxviZw045K1ljK3q0xR5U0jFNX4Tbp8FinK0WegGl4KNvA7W1n\nHERqkF//L0bnyKM1l/d/FPgoCSafi7YoM31UvLvmqXdUxpQwvSG4ot7NBl+CE5hb\n1mCp6ntVjL1h3ej/LaoCTBk+5VF3TV85Mw469rjPuJYnTjZWyyVQgICv12rFBTAr\nNLGmbGM3s8YPCFkedq3p34SYo8ajHy8D0QdiTnoX3VZTDOL5AxYErF4oG20/w3dY\npIITfTIc0aacyIgK7KGZhpcD6E4e9KxVf4PunrVoYQKBgQDdPrayP+6YX+m2TEDZ\noa41hiWJr4kLtVgJkVzSBNrXHD1txZ0+hRm6uXWBK6lfzheRJjpufnK96Rq9B2Tf\nGEwcyWbwexjm/94XMDdS7GUwmp4XXRjfHWdDXybFhjlppiCWOsuaIXyTLwHZ6ktd\n366KMXFaXrH2TZ0AW+ilA7QapQKBgQDUSd/sCRif5xQkL51VCnBUpfNBliP19giS\n303mi/ImsJ0dHKdL4VGerIQgOsVZ3i2D+pzrPyKGtGhlmAWVC5F3SQ50sDKljTBV\nBduZGyELzGNLAQmP+t2VEdd33iX4M3R8Pnd4jyfHIf7K1rTju46rB9fWCCc30EFd\na+otVRXkTwKBgQC5QvB9JmfGlFoB2qxbELXt/9yjBKf/c+S6bkyJWKNfiTgvGVDo\nr0+yOeYZOdRkcxDs7FP1flDakb1gGDbxUUk6ubNHH+zkUdFJHYjWGTlKj85dxgkz\nm02C7sRqllCxFPkokyc2c1/7Z1tnfHeLrehbs7c1cyIWGzuit1OCCi3gOQKBgEw6\nfsK1/XaltnDL/DXmOrHaqT/a1uziPO/oaYOoqvpDnxcuC9DOhs1waz1bfTQo+LUU\nj7ZVhGNUcsxQS2jar5Bi1mMGRhl2Wm2dXd5bhIFFEj6Dj9h4n4qAzptHVOEMMP7Q\nO3w6A3GY/nH9qRTBa5h0h4dehB6hlGckcgF3NRY3AoGBAJf11p7qkXCv35Bdnr2Z\nIaQEYKf4kdHj7+7I4V/AHC3eBPNB01HhmVzPEqgC/FqCXTL96n/GKQq9XbXmCoO4\nVlQkS47gJRvJeDdB/YKPgMpXFP4vGr8UISIkD8ahtRKBSyDMsGBMf2DDPoorucRt\n72Y0i3oZaZpAnSsByow92b4E\n-----END PRIVATE KEY-----'
export const WANTED_SIGALGS = [
  'ecdsa_secp256r1_sha256',
  'rsa_pss_rsae_sha256',
  'rsa_pkcs1_sha256',
  'ecdsa_secp384r1_sha384',
  'rsa_pss_rsae_sha384',
  'rsa_pkcs1_sha384',
  'rsa_pss_rsae_sha512',
  'rsa_pkcs1_sha512',
  'rsa_pkcs1_sha1',
].join(':')

type ReplacerFn = (e: Element) => void

export enum Side {
  Client = 1 << 0,
  Server = 1 << 1,
}

export interface IJabberProxyReplacer {
  side: Side
  replacer: ReplacerFn
}

export function createReplacer(
  side: Side,
  replacer: ReplacerFn
): IJabberProxyReplacer {
  return { side, replacer }
}

export function modifyElement(
  side: Side,
  element: Element,
  replacers: IJabberProxyReplacer[]
) {
  for (const rep of replacers) {
    // This replacer isn't for "side"
    if ((rep.side & side) === 0) continue
    rep.replacer(element)
  }
}

// https://cs.github.com/xmppjs/xmpp.js/blob/2a80170079dff7c855aa1e5f6d91a31e0392974f/packages/connection-tcp/index.js
export const xmpp = {
  header: (e: Element) => `<?xml version='1.0'?>${e.toString().slice(0, -2)}>`,
  footer: (_: Element) => `</stream:stream>`,
}
