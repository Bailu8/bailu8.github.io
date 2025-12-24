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
  // 目标：不要“新窗口/新标签页”打开。
  // - 浏览器：同窗口跳转
  // - Telegram：内部链接仍在 WebApp 内跳转；外部 http(s) 交给 tg.openLink
  const tg = getTg();

  let parsed;
  try {
    parsed = new URL(url, window.location.href);
  } catch {
    window.location.assign(url);
    return;
  }

  const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
  const isSameOrigin = parsed.origin === window.location.origin;
  const isInternal = !isHttp || isSameOrigin;

  if (isInternal) {
    window.location.assign(parsed.href);
    return;
  }

  if (tg && typeof tg.openLink === "function") {
    tg.openLink(parsed.href);
    return;
  }

  // 非 Telegram 且为外部 http(s)：同窗口跳转
  window.location.assign(parsed.href);
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
