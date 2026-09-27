"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function BariAgentWidget() {
  const pathname = usePathname();
  // Only display the AI chat assistant on the homepage as requested by user
  const isHomepage = pathname === "/" || pathname === "";

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isHomepage) {
        document.body.classList.add("is-homepage");
      } else {
        document.body.classList.remove("is-homepage");
      }
    }

    const wrap = document.querySelector(".bari-widget-wrap") as HTMLElement;
    if (wrap) {
      wrap.style.display = isHomepage ? "block" : "none";
    }

    if (!isHomepage) return;

    if (document.getElementById("bari-agent-script")) return;

    const script = document.createElement("script");
    script.id = "bari-agent-script";
    script.src = "https://barigroup.net/wp-content/themes/barigroup-theme/assets/js/bari-agent.js";
    script.setAttribute("data-agent-key", "bari_3781ab8abd2cf914");
    script.setAttribute("data-theme", "#d40026");
    script.setAttribute("data-title", "BS Baristore AI");
    script.setAttribute("data-persona", "ecommerce");
    script.setAttribute("data-position", "right");
    script.setAttribute("data-proactive", "0"); // Disable annoying auto-popup speech bubble!
    script.setAttribute("data-endpoint", "https://barigroup.net/wp-admin/admin-ajax.php");
    script.async = true;

    document.body.appendChild(script);
  }, [pathname, isHomepage]);

  return null;
}
