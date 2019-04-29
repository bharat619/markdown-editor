const { remote, ipcRenderer } = require("electron");
const path = require("path");
const marked = require("marked");

const mainProcess = remote.require("./main.js");

const markdownView = document.querySelector("#markdown");
const htmlView = document.querySelector("#html");
const newFileButton = document.querySelector("#new-file");
const opneFileButton = document.querySelector("#open-file");
const saveMarkdownButton = document.querySelector("#save-markdown");
const revertButton = document.querySelector("#revert");
const saveHtmlButton = document.querySelector("#save-html");
const showFileButton = document.querySelector("#show-file");
const openInDefaultButton = document.querySelector("#open-in-default");

document.addEventListener("dragstart", e => e.preventDefault());
document.addEventListener("dragover", e => e.preventDefault());
document.addEventListener("dragleave", e => e.preventDefault());
document.addEventListener("drop", e => e.preventDefault());

let originalContent = "";
let filePath = null;

const renderMarkdownToHtml = markdown => {
  htmlView.innerHTML = marked(markdown, { sanitize: true });
};

const updateUserInterface = isEdited => {
  let title = "Fire Sale";
  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`;
  }
  if (isEdited) {
    title = `${title} - Edited`;
  }
  remote.getCurrentWindow().setTitle(title);
  remote.getCurrentWindow().setDocumentEdited(isEdited);

  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;
};

const getDraggedFile = event => {
  return event.dataTransfer.items[0];
};

const getDroppedFile = event => {
  return event.dataTransfer.files[0];
};

const isFileTypeSupported = file => {
  return ["text/plain", "text/markdown"].includes(file.type);
};

opneFileButton.addEventListener("click", () => {
  const window = remote.getCurrentWindow();
  mainProcess.getFileFromUser(window);
});

newFileButton.addEventListener("click", () => {
  mainProcess.createWindow();
});

markdownView.addEventListener("keyup", event => {
  const currentContent = event.target.value;
  const isEdited = currentContent !== originalContent;
  updateUserInterface(isEdited);
});

ipcRenderer.on("file-opened", (event, file, content) => {
  originalContent = content;
  filePath = file;

  markdownView.value = content;
  renderMarkdownToHtml(content);
  updateUserInterface(false);
});

saveHtmlButton.addEventListener("click", () => {
  mainProcess.saveHtml(remote.getCurrentWindow(), htmlView.innerHTML);
});

saveMarkdownButton.addEventListener("click", () => {
  mainProcess.saveMarkdown(remote.getCurrentWindow(), markdownView.value);
});

revertButton.addEventListener("click", () => {
  markdownView.value = originalContent;
  renderMarkdownToHtml(originalContent);
});

markdownView.addEventListener("dragover", event => {
  const file = getDraggedFile(event);
  if (isFileTypeSupported(file)) {
    markdownView.classList.add("drag-over");
  } else {
    markdownView.classList.add("drag-error");
  }
});

markdownView.addEventListener("dragleave", () => {
  markdownView.classList.remove("drag-over");
  markdownView.classList.remove("drag-error");
});
