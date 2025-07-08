console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  wrapper.style.display = "inline-block";
  wrapper.style.marginRight = "4px";

  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3 AI-REPLY-BUTTON";
  button.style.marginLeft = "8px";
  button.style.marginRight = "4px";
  button.style.borderRadius = "18px";
  button.innerHTML = "AI REPLY";
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", "Generate AI Reply");

  // Dropdown for tone selection (hidden by default)
  const toneDropdown = document.createElement("select");
  toneDropdown.style.position = "absolute";
  toneDropdown.style.top = "40px";
  toneDropdown.style.left = "0";
  toneDropdown.style.zIndex = "9999";
  toneDropdown.style.fontSize = "13px";
  toneDropdown.style.padding = "5px";
  toneDropdown.style.borderRadius = "4px";
  toneDropdown.style.border = "1px solid #ccc";
  toneDropdown.style.boxShadow = "0 2px 4px rgba(0,0,0,0.2)";
  toneDropdown.style.backgroundColor = "#fff";
  toneDropdown.style.display = "none"; // hide initially

  const tones = ["Professional", "Friendly", "Casual", "Formal"];
  tones.forEach((tone) => {
    const option = document.createElement("option");
    option.value = tone.toLowerCase();
    option.innerText = tone;
    toneDropdown.appendChild(option);
  });

  // On AI REPLY button click — show dropdown
  button.addEventListener("click", () => {
    toneDropdown.style.display = "block";
  });

  // On tone select — call API
  toneDropdown.addEventListener("change", async () => {
    const selectedTone = toneDropdown.value;

    button.innerHTML = "Generating...";
    button.disabled = true;
    toneDropdown.style.display = "none";

    try {
      const emailContent = getEmailContent();

      const response = await fetch("http://localhost:8080/api/email/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailContent: emailContent,
          tone: selectedTone,
        }),
      });

      if (!response.ok) throw new Error("API Request Failed");

      const generatedReply = await response.text();
      const composeBox = document.querySelector(
        '[role="textbox"][g_editable="true"]'
      );
      if (composeBox) {
        composeBox.focus();
        document.execCommand("insertText", false, generatedReply);
      } else {
        console.error("composeBox was not found");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate reply");
    } finally {
      button.innerHTML = "AI REPLY";
      button.disabled = false;
      toneDropdown.value = "professional"; // reset
    }
  });

  wrapper.appendChild(button);
  wrapper.appendChild(toneDropdown);
  return wrapper;
}

function getEmailContent() {
  const selectors = [
    ".h7",
    ".a3s.aiL",
    ".gmail_quote",
    '[role="presentation"]',
  ];
  for (const selector of selectors) {
    const Content = document.querySelector(selector);
    if (Content) {
      return Content.innerText.trim();
    }
  }
  return "";
}

function findComposeToolbar() {
  const selectors = [".btC", ".aDh", '[role="toolbar"]', ".gU.Up"];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) {
      return toolbar;
    }
  }
  return null;
}

function injectButton() {
  const existingButton = document.querySelector(".AI-REPLY-BUTTON");
  if (existingButton) existingButton.remove();

  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }

  console.log("Toolbar found , creating AI button");
  console.log("Toolbar found, creating AI reply button with tone selector");
  const aiButtonWrapper = createAIButton();
  toolbar.insertBefore(aiButtonWrapper, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh, .btC, [role="dialog"]') ||
          node.querySelector('.aDh, .btC, [role="dialog"]'))
    );

    if (hasComposeElements) {
      console.log("Compose Window Detected");
      setTimeout(injectButton, 500);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
