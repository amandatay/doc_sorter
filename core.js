/* Core — pure logic only. No DOM, no IndexedDB, no network.
 * Exposed as window.Core in the browser and module.exports in Node. */

const Core = {
  /* Logic added milestone by milestone (M1+). */
};

if (typeof module !== 'undefined') module.exports = Core;
else window.Core = Core;
