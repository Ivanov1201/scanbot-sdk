const results = [];
let scanbotSDK, documentScanner, barcodeScanner, mrzScanner, croppingView;

const OCR_CONFIDENCE_LIMIT = 65;
const MRZ_DELAY_TIME = 1000;
window.onresize = () => {
  this.resizeContent();
};

window.onload = async () => {
  scanbotSDK = await ScanbotSDK.initialize({ licenseKey: Config.license(), engine: '/wasm/' });

  this.resizeContent();

  Utils.getElementByClassName("document-scanner-button").onclick = async (
    e
  ) => {
    Utils.getElementByClassName("scanbot-camera-controller").style.display = "block";
    Utils.getElementByClassName('content-container').style.display = 'none';
    const config = {
      containerId: Config.scannerContainerId(),
      acceptedAngleScore: 60,
      acceptedSizeScore: 60,
      autoCaptureSensitivity: 0.66,
      autoCaptureEnabled: true,
      ignoreBadAspectRatio: false,
      onDocumentDetected: onDocumentDetected,
      onError: onScannerError,
      text: {
        hint: {
          OK: "Capturing your document...",
          OK_SmallSize: "The document is too small. Try moving closer.",
          OK_BadAngles:
            "This is a bad camera angle. Hold the device straight over the document.",
          OK_BadAspectRatio:
            "Rotate the device sideways, so that the document fits better into the screen.",
          OK_OffCenter: "Try holding the device at the center of the document.",
          Error_NothingDetected:
            "Please hold the device over a document to start scanning.",
          Error_Brightness: "It is too dark. Try turning on a light.",
          Error_Noise: "Please move the document to a clear surface.",
        },
      },
      preferredCamera: 'camera2 0, facing back'
    };
    try {
      documentScanner = await scanbotSDK.createDocumentScanner(config);
    } catch (e) {
      console.log(e.name + ': ' + e.message);
      alert(e.name + ': ' + e.message);
      Utils.getElementByClassName("scanbot-camera-controller").style.display = "none";
      Utils.getElementByClassName('content-container').style.display = 'display';
    }
  };
  Utils.getElementByClassName("mrz-scanner-button").onclick = async (e) => {
    Utils.getElementByClassName("mrz-scanner-controller").style.display = "block";
    Utils.getElementByClassName("content-container").style.display = "none";
    const config = {
      containerId: Config.mrzScannerContainerId(),
      onMrzDetected: onMrzDetected,
      onError: onScannerError,
      preferredCamera: 'camera2 0, facing back',
    };
    try {
      mrzScanner = await scanbotSDK.createMrzScanner(config);
    } catch (e) {
      console.log(e.name + ': ' + e.message);
      alert(e.name + ': ' + e.message);
      Utils.getElementByClassName("mrz-scanner-controller").style.display = "none";
      Utils.getElementByClassName("content-container").style.display = "block";
    }
  };
  Utils.getElementByClassName("ocr-button").onclick = async (e) => {
    Utils.getElementByClassName('ocr-controller').style.display = "block";
    Utils.getElementByClassName("content-container").style.display = "none";
  }
  Utils.getElementByClassName('url-back-button').onclick = async (e) =>{
    Utils.getElementByClassName('url-controller').style.display = 'none';
    Utils.getElementByClassName('scanbot-camera-controller').style.display = 'block';
    Utils.getElementByClassName("url-ocr-container").innerHTML = '';
    Utils.getElementByClassName("url-result-image").innerHTML = '';
    const config = {
      containerId: Config.scannerContainerId(),
      acceptedAngleScore: 60,
      acceptedSizeScore: 60,
      autoCaptureSensitivity: 0.66,
      autoCaptureEnabled: true,
      ignoreBadAspectRatio: false,
      onDocumentDetected: onDocumentDetected,
      onError: onScannerError,
      text: {
        hint: {
          OK: "Capturing your document...",
          OK_SmallSize: "The document is too small. Try moving closer.",
          OK_BadAngles:
            "This is a bad camera angle. Hold the device straight over the document.",
          OK_BadAspectRatio:
            "Rotate the device sideways, so that the document fits better into the screen.",
          OK_OffCenter: "Try holding the device at the center of the document.",
          Error_NothingDetected:
            "Please hold the device over a document to start scanning.",
          Error_Brightness: "It is too dark. Try turning on a light.",
          Error_Noise: "Please move the document to a clear surface.",
        },
      },
      preferredCamera: 'camera2 0, facing back'
    };
    documentScanner = await scanbotSDK.createDocumentScanner(config);
  }

  const backButtons = document.getElementsByClassName("back-button");
  for (let i = 0; i < backButtons.length; i++) {
    const button = backButtons[i];
    button.onclick = async (e) => {
      const controller =
        e.target.parentElement.parentElement.parentElement.className;
      Utils.getElementByClassName(controller).style.display = "none";
      Utils.getElementByClassName("content-container").style.display = "block";

      if (controller.includes("mrz-scanner-controller")) {
        mrzScanner.dispose();
        mrzScanner = undefined;
      }
      else if(controller.includes("scanbot-camera-controller")) {
        documentScanner.dispose() ;
        documentScanner = undefined ;
      }

    };
  }
  async function reloadDetectionResults() {
    const container = Utils.getElementByClassName("detection-results-container");
    container.innerHTML = await Utils.renderDetectionResults();
    const size = container.offsetWidth / 3;

    const items = document.getElementsByClassName("detection-result-list-image");
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      item.style.width = size;
      item.style.height = size;
      item.onclick = onDetectionResultClick;
    }
  }

  Utils.getElementByClassName("detection-done-button").onclick = async (e) => {
    documentScanner.dispose();
    Utils.getElementByClassName("scanbot-camera-controller").style.display =
      "none";
    Utils.getElementByClassName("detection-results-controller").style.display =
      "block";

    await reloadDetectionResults();
  };

  Utils.getElementByClassName("pdf-button").onclick = async (e) => {
    if (results.length === 0) {
      console.log("No image results to save");
      return;
    }
    ViewUtils.showLoading();
    const generator = await scanbotSDK.beginPdf({
      standardPaperSize: "A4",
      landscape: true,
      dpi: 100,
    });
    await addAllPagesTo(generator);
    const bytes = await generator.complete();
    Utils.saveBytes(bytes, Utils.generateName() + ".pdf");
    ViewUtils.hideLoading();
  };

  Utils.getElementByClassName("tiff-button").onclick = async (e) => {
    if (results.length === 0) {
      console.log("No image results to save");
      return;
    }
    ViewUtils.showLoading();
    const generator = await scanbotSDK.beginTiff({
      binarizationFilter: "deepBinarization",
      dpi: 123,
    });
    await addAllPagesTo(generator);
    const bytes = await generator.complete();
    Utils.saveBytes(bytes, Utils.generateName() + ".tiff");
    ViewUtils.hideLoading();
  };

  Utils.getElementById("mrz-scanner-stop").onclick = async (e) => {
    let isMrzScannerStopped = mrzScanner.isDetectionPaused();
    if (isMrzScannerStopped) {
      mrzScanner.resumeDetection();
      Utils.getElementById("mrz-scanner-stop").innerHTML = "&#8741"
    }
    else {
      mrzScanner.pauseDetection();
      Utils.getElementById("mrz-scanner-stop").innerHTML = "&#9205"
    }
  }
  Utils.getElementByClassName("ocr-scanner-btn").onclick = async (e) => {
    let url = Utils.getElementByClassName("ocr-url-input").value;
    if (url === "") return;
    const ocr = await scanbotSDK.createOcrEngine(["eng", "deu"]);
    const result = await ocr.recognizeURL(url);
    let str = "", rect = Utils.getElementByClassName("ocr-url-input").getBoundingClientRect();

    let hei = rect.y + rect.height + 10;
    let wid = Utils.getElementByClassName("ocr-controller").getBoundingClientRect().width / 2;
    result.forEach((obj) => {
      if (obj.confidence > OCR_CONFIDENCE_LIMIT) {
        str += "<div style='position:absolute; top: " +
          (obj.boundingBox.y + hei) + "px; left:" + obj.boundingBox.x + "px'>" + obj.text + "</div>"
      }
    })
    Utils.getElementByClassName("ocr-results-container").innerHTML = str;
    str = "<img src ='" + url + "' style = 'position:absolute; left:" + wid + "px'/>"
    Utils.getElementByClassName("ocr-result-image").innerHTML = str;
    await ocr.release();
  }
  ViewUtils.hideLoading();
};

async function onDocumentDetected(e) {
  documentScanner.dispose(); 
  Utils.getElementByClassName('scanbot-camera-controller').style.display = 'none';
  Utils.getElementByClassName('url-controller').style.display = 'block';
  results.push(e);
  ViewUtils.flash();
  const imageUrl = await scanbotSDK.toDataUrl(Utils.imageToDisplay(e));
  let url = imageUrl ;
  const ocr = await scanbotSDK.createOcrEngine(["eng", "deu"]);
  const result = await ocr.recognizeURL(url);
  let str = "", rect = Utils.getElementByClassName('url-ocr-container').getBoundingClientRect();
  let hei = 90;
  let wid = Utils.getElementByClassName("url-controller").getBoundingClientRect().width / 2;
  result.forEach((obj) => {
    if (obj.confidence > OCR_CONFIDENCE_LIMIT) {
      str += "<div style='position:absolute; top: " +
        (obj.boundingBox.y + hei) + "px; left:" + obj.boundingBox.x + "px'>" + obj.text + "</div>"
    }
  })
  Utils.getElementByClassName("url-ocr-container").innerHTML = str;
  str = "<img src ='" + url + "' style = 'position:absolute; left:" + wid + "px; top:" + hei +"px '/>"
  Utils.getElementByClassName("url-result-image").innerHTML = str;
  await ocr.release();

  Utils.getElementByClassName("page-count-indicator").innerHTML =
    results.length + " PAGES";
}

async function onMrzDetected(mrz) {
  mrzScanner.pauseDetection();

  let text = "", areaText = Utils.getElementById('mrz-textarea').innerHTML;
  if (mrz) {
    text = text + 'Document Type: ' + (mrz.documentType ? (mrz.documentType.value) : '') + '\n';
    text = text + 'First Name: ' + (mrz.givenNames ? (mrz.givenNames.value) : '') + '\n';
    text = text + 'Last Name: ' + (mrz.surname ? (mrz.surname.value) : '') + '\n';
    text = text + 'Issuing Authority: ' + (mrz.issuingAuthority ? (mrz.issuingAuthority.value) : '') + '\n';
    text = text + 'Nationality: ' + (mrz.nationality ? (mrz.nationality.value) : '') + '\n';
    text = text + 'Birth Date: ' + (mrz.birthDate ? (mrz.birthDate.value) : '') + '\n';
    text = text + 'Gender: ' + (mrz.gender ? (mrz.gender.value) : '') + '\n';
    text = text + 'Date of Expiry: ' + (mrz.expiryDate ? (mrz.expiryDate.value) : '') + '\n';
  }
  Utils.getElementById('mrz-textarea').innerHTML = text + "\n" + areaText;
  setTimeout(() => {
    mrzScanner.resumeDetection();
  }, MRZ_DELAY_TIME);
}
async function addAllPagesTo(generator) {
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    await generator.addPage(Utils.imageToDisplay(result));
  }
}
function resizeContent() {
  const height = document.body.offsetHeight - (50 + 59);
  const controllers = document.getElementsByClassName("controller");
  for (let i = 0; i < controllers.length; i++) {
    const controller = controllers[i];
    controller.style.height = height;
  }
}
async function onScannerError(e) {
  console.log("Error:", e);
  alert(e.name + ': ' + e.message);
}
