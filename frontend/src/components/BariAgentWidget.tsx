"use client";

import { useEffect } from "react";

export default function BariAgentWidget() {
  useEffect(() => {
    // Ensure script only loads once in the browser
    if (typeof window === "undefined") return;
    if (document.getElementById("bari-agent-script")) return;

    const script = document.createElement("script");
    script.id = "bari-agent-script";
    script.src = "https://barigroup.net/wp-content/themes/barigroup-theme/assets/js/bari-agent.js";
    script.setAttribute("data-agent-key", "bari_3781ab8abd2cf914");
    script.setAttribute("data-theme", "#d40026");
    script.setAttribute("data-title", "BS Baristore AI");
    script.setAttribute("data-persona", "ecommerce");
    script.setAttribute("data-position", "right");
    script.setAttribute("data-endpoint", "https://barigroup.net/wp-admin/admin-ajax.php");
    script.async = true;

    document.body.appendChild(script);
  }, []);

  return null;
}
