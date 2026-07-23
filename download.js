(function () {
  // Files may be at repo root (browser upload) or under downloads/parts/
  const CANDIDATES = [
    { manifest: "./manifest.json", partsBase: "./" },
    { manifest: "./downloads/parts/manifest.json", partsBase: "./downloads/parts/" },
  ];

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
      let manifest = null;
      let partsBase = "./";
      for (const c of CANDIDATES) {
        const manifestRes = await fetch(c.manifest, { cache: "no-store" });
        if (manifestRes.ok) {
          manifest = await manifestRes.json();
          partsBase = c.partsBase;
          break;
        }
      }
      if (!manifest) {
        throw new Error(
          "Manifest missing. Upload manifest.json + setup.part01–05.bin next to index.html.",
        );
      }
      const chunks = [];
      const total = manifest.parts.length;

      for (let i = 0; i < manifest.parts.length; i++) {
        const name = manifest.parts[i];
        setStatus(`Downloading part ${i + 1} of ${total}…`);
        const res = await fetch(partsBase + name, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Part not found: ${name}`);
        }
        const buf = await res.arrayBuffer();
        chunks.push(buf);
      }

      setStatus("Building installer…");
      const blob = new Blob(chunks, { type: "application/octet-stream" });
      if (manifest.totalBytes && blob.size !== manifest.totalBytes) {
        console.warn("Size mismatch", blob.size, manifest.totalBytes);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = manifest.fileName || "SB-Launcher-Setup-2.2.0.exe";
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
