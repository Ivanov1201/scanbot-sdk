class Config {
  static license() {
    var licenseKey =
      "GE90pMzeDwVY9YEPe0Jaq8ojjhABil" +
      "f4N678/fFndOens9NK5WhKheGj+0nX" +
      "oDdPkCgMeIzUh2D4XRmJwscTc2JCaf" +
      "du/sxgXwYfvYQ5e4/NJY7XUcqnyNRf" +
      "/3Fn/KCRAgC6hURqXmIdzFC23cK9hC" +
      "vFu2s61Q+OPTnv+6dxwLY8LNTxHwA0" +
      "HkXVeuGTrWwgWAgRIyL1fEcWaG+59/" +
      "j2atlVvz/jp5rI7Hz4AeOk9ukLM0QV" +
      "R+mrsQNwNKUDYHsWfhaAHgHw/fMZoh" +
      "OgMHJJscQWns0iaeE9Ox8PkdGFOW3u" +
      "T5GCRwAQoa93EsZ7XBM4wiS+Ux9RlR" +
      "A19cK0gYZBkQ==\nU2NhbmJvdFNESw" +
      "oqaWFzY2FuLnVzaHVyLm1lfGlhc2Nh" +
      "bi51c2h1ci5tZSp8bG9jYWxob3N0Cj" +
      "E2OTgyNzgzOTkKMTE1NTY3OAo4\n";
    return licenseKey ;
  }

  static scannerContainerId() {
    return "scanbot-camera-container";
  }
  static barcodeScannerContainerId() {
    return "barcode-scanner-container";
  }
  static barcodeScannerOverlayContainerId() {
    return "barcode-scanner-overlay-container";
  }
  static mrzScannerContainerId() {
    return "mrz-scanner-container";
  }
  static textDataScannerContainerId() {
    return "text-data-scanner-container";
  }
  static croppingViewContainerId() {
    return "cropping-view-container";
  }

  static barcodeScannerConfig() {
    const barcodeFormats = [
      "AZTEC",
      "CODABAR",
      "CODE_39",
      "CODE_93",
      "CODE_128",
      "DATA_MATRIX",
      "EAN_8",
      "EAN_13",
      "ITF",
      "MAXICODE",
      "PDF_417",
      "QR_CODE",
      "RSS_14",
      "RSS_EXPANDED",
      "UPC_A",
      "UPC_E",
      "UPC_EAN_EXTENSION",
      "MSI_PLESSEY",
    ];

    return {
      // style: {
      //     window: {
      //         borderColor: "blue"
      //     },
      //     text: {
      //         color: "red",
      //         weight: 500
      //     }
      // },
      returnBarcodeImage: true,
      barcodeFormats: barcodeFormats,
      preferredCamera: 'camera2 0, facing back'
    };

  }
}
