function getTg() {
  return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
}

function prettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setPre(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function openLink(url) {
  const tg = getTg();
  if (tg && typeof tg.openLink === "function") {
    tg.openLink(url);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function setThemeVars(vars) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    if (!value) return;
    root.style.setProperty(key, value);
  });
}

function applyTelegramTheme(tg) {
  const tp = tg?.themeParams || {};

  // Telegram 常见字段：bg_color, text_color, hint_color, link_color,
  // button_color, button_text_color, secondary_bg_color
  // 我们把能用的映射到 CSS tokens；不强求全部存在。
  setThemeVars({
    "--bg": tp.bg_color,
    "--text": tp.text_color,
    "--muted": tp.hint_color,
    "--card": tp.secondary_bg_color,
    "--primary": tp.button_color,
  });

  // 让浏览器表单/滚动条等也跟随
  if (tg?.colorScheme) {
    document.documentElement.style.colorScheme = tg.colorScheme;
  }
}

function getDisplayNameFromTg(tg) {
  const user = tg?.initDataUnsafe?.user;
  if (!user) return null;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username || null;
}

function init() {
  const tg = getTg();
  const inTelegram = Boolean(tg);

  const envHint = document.getElementById("env-hint");
  if (envHint) {
    const platform = tg?.platform ? `Telegram/${tg.platform}` : "Browser";
    const scheme = tg?.colorScheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    envHint.textContent = `环境：${platform} · ${scheme}`;
  }

  if (tg) {
    tg.ready();

    applyTelegramTheme(tg);
    tg.onEvent?.("themeChanged", () => {
      applyTelegramTheme(tg);
      const scheme = tg?.colorScheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      const platform = tg?.platform ? `Telegram/${tg.platform}` : "Browser";
      const envHint2 = document.getElementById("env-hint");
      if (envHint2) envHint2.textContent = `环境：${platform} · ${scheme}`;
    });

    const displayName = getDisplayNameFromTg(tg);
    if (displayName) {
      setText("display-name", displayName);
      setText("page-title", `${displayName} · 个人主页`);
      setText("page-subtitle", "欢迎来看看我的技能与作品");
    }
  }

  document.querySelectorAll("[data-link]").forEach((el) => {
    el.addEventListener("click", () => {
      const url = el.getAttribute("data-link");
      if (!url) return;
      openLink(url);
    });
  });
}

init();
