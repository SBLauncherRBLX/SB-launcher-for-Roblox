(function () {
  const MANIFEST_URL = "./downloads/parts/manifest.json";
  const PARTS_BASE = "./downloads/parts/";

  async function downloadAssembled() {
    const status = document.getElementById("download-status");
    const buttons = document.querySelectorAll("[data-download-setup]");
    const setStatus = (text) => {
      if (status) status.textContent = text;
    };
    buttons.forEach((b) => {
      b.setAttribute("aria-disabled", "true");
      b.classList.add("is-busy");
    });

    try {
      setStatus("Preparing download…");
      const manifestRes = await fetch(MANIFEST_URL, { cache: "no-store" });
      if (!manifestRes.ok) {
        throw new Error("Manifest missing. Upload docs/site/downloads/parts/ to GitHub.");
      }
      const manifest = await manifestRes.json();
      const chunks = [];
      let loaded = 0;
      const total = manifest.parts.length;

      for (let i = 0; i < manifest.parts.length; i++) {
        const name = manifest.parts[i];
        setStatus(`Downloading part ${i + 1} of ${total}…`);
        const res = await fetch(PARTS_BASE + name, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Part not found: ${name}`);
        }
        const buf = await res.arrayBuffer();
        chunks.push(buf);
        loaded += buf.byteLength;
      }

      setStatus("Building installer…");
      const blob = new Blob(chunks, { type: "application/octet-stream" });
      if (manifest.totalBytes && blob.size !== manifest.totalBytes) {
        console.warn("Size mismatch", blob.size, manifest.totalBytes);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = manifest.fileName || "SB-Launcher-Setup-2.1.0.exe";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("Download started. Run the installer when it finishes.");
    } catch (err) {
      console.error(err);
      setStatus(
        err instanceof Error
          ? err.message
          : "Download failed. Make sure all setup.partXX.bin files are on GitHub Pages.",
      );
    } finally {
      buttons.forEach((b) => {
        b.removeAttribute("aria-disabled");
        b.classList.remove("is-busy");
      });
    }
  }

  function bind() {
    document.querySelectorAll("[data-download-setup]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        void downloadAssembled();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
