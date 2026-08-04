{
  "design_system_name": "Astra Loot Index (Destiny-style sci-fi HUD)",
  "brand_attributes": [
    "cinematic",
    "premium",
    "tactical HUD",
    "high-contrast readability",
    "collector-focused",
    "fast + data-dense"
  ],
  "inspiration_refs": {
    "reference_searches": [
      {
        "title": "Destiny 2 UI / HUD concepts",
        "urls": [
          "https://www.behance.net/gallery/60073341/Destiny-2-UI-Visual-Design",
          "https://willowstration.com/project/destiny-2-ui-icons",
          "https://dribbble.com/search/sci-fi-hud",
          "https://dribbble.com/search/dark-futuristic-ui"
        ]
      },
      {
        "title": "Dark sci-fi dashboards / panels",
        "urls": [
          "https://www.aura.build/templates/rising-spirit-41",
          "https://www.aura.build/templates/sci-fi-navigation-89",
          "https://itch.io/devlog/1509395/dark-neon-game-ui-concepts-is-now-available.amp"
        ]
      }
    ],
    "design_fusion_recipe": "Use Destiny-like restrained typography + iconography, combine with modern bento-grid dashboards (Aura templates) and rarity-coded inventory frames. Keep surfaces matte (near-black) with thin luminous strokes and subtle noise."
  },
  "typography": {
    "google_fonts": {
      "display": {
        "family": "Space Grotesk",
        "weights": [
          500,
          600,
          700
        ],
        "usage": "H1/H2, activity titles, encounter headers"
      },
      "body": {
        "family": "IBM Plex Sans",
        "weights": [
          400,
          500,
          600
        ],
        "usage": "Body, labels, filters, tables"
      },
      "mono": {
        "family": "IBM Plex Mono",
        "weights": [
          400,
          500
        ],
        "usage": "Hashes/IDs, drop rates (if added later), small telemetry-like UI"
      }
    },
    "tailwind_text_hierarchy": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight",
      "h2": "text-base md:text-lg text-muted-foreground",
      "section_title": "text-lg sm:text-xl font-semibold tracking-tight",
      "card_title": "text-sm sm:text-base font-semibold",
      "label": "text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground",
      "body": "text-sm sm:text-base leading-relaxed",
      "micro": "text-xs text-muted-foreground"
    },
    "notes": [
      "Avoid overly wide tracking; Destiny-like UI feels precise. Use uppercase labels sparingly (filters, metadata).",
      "Numbers/progress: prefer IBM Plex Mono for a HUD/telemetry vibe."
    ]
  },
  "color_system": {
    "mode": "dark-first",
    "gradient_restriction_rule": {
      "prohibited": [
        "blue-500 to purple-600",
        "purple-500 to pink-500",
        "green-500 to blue-500",
        "red to pink"
      ],
      "rules": [
        "NEVER let gradients cover more than 20% of the viewport.",
        "NEVER apply gradients to text-heavy content or reading areas.",
        "NEVER use gradients on small UI elements (<100px width).",
        "NEVER stack multiple gradient layers in the same viewport.",
        "IF gradient area exceeds 20% OR impacts readability THEN fallback to solid colors."
      ],
      "allowed_usage": [
        "Hero background only (subtle, low-saturation)",
        "Decorative overlays (noise + vignette)",
        "Large section headers (background only)"
      ]
    },
    "tokens_hsl_for_index_css": {
      "root_dark": {
        "--background": "222 22% 6%",
        "--foreground": "210 20% 96%",
        "--card": "222 22% 8%",
        "--card-foreground": "210 20% 96%",
        "--popover": "222 22% 8%",
        "--popover-foreground": "210 20% 96%",
        "--primary": "190 92% 45%",
        "--primary-foreground": "222 22% 8%",
        "--secondary": "222 18% 12%",
        "--secondary-foreground": "210 20% 96%",
        "--muted": "222 16% 14%",
        "--muted-foreground": "215 14% 70%",
        "--accent": "190 70% 18%",
        "--accent-foreground": "210 20% 96%",
        "--destructive": "0 72% 52%",
        "--destructive-foreground": "210 20% 96%",
        "--border": "222 16% 18%",
        "--input": "222 16% 18%",
        "--ring": "190 92% 45%",
        "--radius": "0.75rem"
      },
      "extended_css_custom_properties_add": {
        "--hud-grid": "rgba(255,255,255,0.04)",
        "--hud-glow": "rgba(34,211,238,0.22)",
        "--hud-glow-strong": "rgba(34,211,238,0.35)",
        "--panel": "rgba(10,14,18,0.72)",
        "--panel-border": "rgba(255,255,255,0.08)",
        "--panel-border-strong": "rgba(255,255,255,0.14)",
        "--shadow-elev": "0 18px 60px rgba(0,0,0,0.55)",
        "--shadow-soft": "0 10px 30px rgba(0,0,0,0.35)",
        "--noise-opacity": "0.06"
      }
    },
    "rarity_colors": {
      "common": {
        "name": "Common",
        "hex": "#C9CDD3",
        "border": "rgba(201,205,211,0.55)",
        "glow": "rgba(201,205,211,0.18)"
      },
      "uncommon": {
        "name": "Uncommon",
        "hex": "#3FE07A",
        "border": "rgba(63,224,122,0.55)",
        "glow": "rgba(63,224,122,0.18)"
      },
      "rare": {
        "name": "Rare",
        "hex": "#4AA3FF",
        "border": "rgba(74,163,255,0.55)",
        "glow": "rgba(74,163,255,0.18)"
      },
      "legendary": {
        "name": "Legendary",
        "hex": "#B07CFF",
        "border": "rgba(176,124,255,0.55)",
        "glow": "rgba(176,124,255,0.18)"
      },
      "exotic": {
        "name": "Exotic",
        "hex": "#F6C453",
        "border": "rgba(246,196,83,0.6)",
        "glow": "rgba(246,196,83,0.22)"
      }
    },
    "element_colors": {
      "kinetic": {
        "hex": "#D7DCE3",
        "badge_bg": "rgba(215,220,227,0.10)",
        "badge_border": "rgba(215,220,227,0.22)"
      },
      "arc": {
        "hex": "#4AA3FF",
        "badge_bg": "rgba(74,163,255,0.12)",
        "badge_border": "rgba(74,163,255,0.24)"
      },
      "solar": {
        "hex": "#FF9A3D",
        "badge_bg": "rgba(255,154,61,0.12)",
        "badge_border": "rgba(255,154,61,0.24)"
      },
      "void": {
        "hex": "#B07CFF",
        "badge_bg": "rgba(176,124,255,0.12)",
        "badge_border": "rgba(176,124,255,0.24)"
      },
      "stasis": {
        "hex": "#7FE7FF",
        "badge_bg": "rgba(127,231,255,0.12)",
        "badge_border": "rgba(127,231,255,0.24)"
      },
      "strand": {
        "hex": "#3FE07A",
        "badge_bg": "rgba(63,224,122,0.12)",
        "badge_border": "rgba(63,224,122,0.24)"
      }
    },
    "background_treatment": {
      "hero_gradient_css": "radial-gradient(900px 420px at 20% 10%, rgba(34,211,238,0.10), transparent 60%), radial-gradient(700px 360px at 80% 0%, rgba(127,231,255,0.08), transparent 55%), radial-gradient(900px 520px at 50% 120%, rgba(255,154,61,0.06), transparent 60%)",
      "vignette_css": "radial-gradient(1200px 700px at 50% 0%, transparent 40%, rgba(0,0,0,0.55) 100%)",
      "hud_grid_css": "linear-gradient(to right, var(--hud-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--hud-grid) 1px, transparent 1px)",
      "notes": [
        "Use gradients only in hero/top header band (<= 20% viewport height).",
        "Main reading surfaces are solid near-black panels with subtle borders."
      ]
    }
  },
  "spacing_and_layout": {
    "spacing_philosophy": "Use 2–3x more spacing than typical dashboards; let loot grids breathe.",
    "container": {
      "max_width": "max-w-6xl 2xl:max-w-7xl",
      "padding": "px-4 sm:px-6 lg:px-8",
      "section_spacing": "py-10 sm:py-14"
    },
    "grid_system": {
      "activity_cards": "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6",
      "loot_grid": "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4",
      "filters_bar": "flex flex-col gap-3 md:flex-row md:items-end md:justify-between",
      "detail_split": "grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6"
    },
    "panel_geometry": {
      "radius": "rounded-xl",
      "panel_padding": "p-4 sm:p-5",
      "border": "border border-white/10",
      "divider": "border-t border-white/10"
    }
  },
  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/card.jsx",
      "/app/frontend/src/components/ui/badge.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/accordion.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/command.jsx",
      "/app/frontend/src/components/ui/input.jsx",
      "/app/frontend/src/components/ui/select.jsx",
      "/app/frontend/src/components/ui/checkbox.jsx",
      "/app/frontend/src/components/ui/progress.jsx",
      "/app/frontend/src/components/ui/scroll-area.jsx",
      "/app/frontend/src/components/ui/skeleton.jsx",
      "/app/frontend/src/components/ui/tooltip.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ],
    "optional_new_components_to_create": [
      "/app/frontend/src/components/LootItemCard.js",
      "/app/frontend/src/components/ActivityCard.js",
      "/app/frontend/src/components/EncounterSection.js",
      "/app/frontend/src/components/FiltersBar.js",
      "/app/frontend/src/components/ItemDetailModal.js",
      "/app/frontend/src/components/ProgressPill.js",
      "/app/frontend/src/components/EmptyStatePanel.js"
    ]
  },
  "component_specs": {
    "app_shell": {
      "header": {
        "layout": "Sticky top header with translucent panel + subtle blur; left brand, center search, right checklist shortcut.",
        "classes": "sticky top-0 z-40 border-b border-white/10 bg-[color:var(--panel)] backdrop-blur supports-[backdrop-filter]:bg-[color:var(--panel)]",
        "micro_interactions": [
          "Header border brightens slightly on scroll (use IntersectionObserver or scrollY threshold).",
          "Search expands on focus (width + glow ring)."
        ],
        "testids": {
          "global_search": "global-search-input",
          "nav_activities": "nav-activities-link",
          "nav_checklist": "nav-checklist-link"
        }
      },
      "background": {
        "implementation": "Use a fixed background layer: starfield image + vignette + HUD grid overlay + noise.",
        "classes": "relative min-h-screen bg-background text-foreground",
        "layers": [
          "<div className='pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-35' style={{backgroundImage: `url(...)`}} />",
          "<div className='pointer-events-none fixed inset-0 -z-10' style={{backgroundImage: `var(--vignette)`}} />",
          "<div className='pointer-events-none fixed inset-0 -z-10 opacity-40 [background-size:48px_48px]' style={{backgroundImage: `var(--hud-grid)`}} />",
          "<div className='pointer-events-none fixed inset-0 -z-10 opacity-[var(--noise-opacity)] mix-blend-overlay bg-[url("data:image/svg+xml,...")]' />"
        ]
      }
    },
    "activity_card": {
      "base": "Card with HUD border, small corner notches, and category icon.",
      "classes": "group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-[var(--shadow-soft)]",
      "hover": "hover:border-white/20 hover:bg-white/7",
      "accent": "Add a 2px left accent bar using activity type color (raid/dungeon/nightfall/world).",
      "cta": "Primary action is 'View Loot' button; secondary is 'Track' (checkbox-like).",
      "testids": {
        "card": "activity-card",
        "view_button": "activity-card-view-button"
      }
    },
    "loot_item_card": {
      "shape": "Square icon (1:1) with rarity frame + subtle glow; metadata below.",
      "classes": {
        "wrapper": "group relative rounded-xl border bg-[color:var(--panel)] p-2 shadow-[var(--shadow-soft)]",
        "icon_wrap": "relative aspect-square overflow-hidden rounded-lg bg-black/30",
        "meta": "mt-2 space-y-1",
        "title": "line-clamp-1 text-sm font-semibold",
        "sub": "flex items-center justify-between gap-2 text-xs text-muted-foreground"
      },
      "rarity_frame": {
        "implementation": "Set CSS vars per rarity: --rarity-border, --rarity-glow. Use border + outer glow + tiny corner notch.",
        "classes": "border-[1.5px]",
        "glow": "shadow-[0_0_0_1px_var(--rarity-border),0_0_24px_var(--rarity-glow)]"
      },
      "badges": {
        "element_badge": "Use shadcn Badge with custom variant 'hud' (semi-transparent bg + border).",
        "type_label": "Small uppercase label (IBM Plex Sans)"
      },
      "obtained_state": {
        "visual": "When obtained: add a subtle checkmark overlay + reduce saturation slightly + show progress tick.",
        "classes": "data-[obtained=true]:opacity-85 data-[obtained=true]:grayscale-[0.15]"
      },
      "testids": {
        "card": "loot-item-card",
        "open_detail": "loot-item-open-detail",
        "toggle_obtained": "loot-item-toggle-obtained"
      }
    },
    "rarity_and_element_badges": {
      "badge_variant_hud": {
        "classes": "rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] font-medium tracking-wide",
        "notes": "Do not use gradients on badges. Use element bg/border from element_colors."
      }
    },
    "tabs_and_filters": {
      "tabs": {
        "component": "shadcn Tabs",
        "classes": "rounded-xl border border-white/10 bg-white/5 p-1",
        "trigger": "data-[state=active]:bg-white/10 data-[state=active]:text-foreground text-muted-foreground",
        "testids": {
          "tabs": "activities-tabs",
          "tab_raids": "activities-tab-raids",
          "tab_dungeons": "activities-tab-dungeons",
          "tab_nightfall": "activities-tab-nightfall",
          "tab_world": "activities-tab-world"
        }
      },
      "filters": {
        "components": [
          "Command (for global search suggestions)",
          "Select (weapon type, element, rarity)",
          "Checkbox (obtained only)",
          "Button (clear filters)"
        ],
        "layout": "Filters bar is a panel with 2 rows on mobile; single row on desktop.",
        "testids": {
          "rarity_select": "filter-rarity-select",
          "element_select": "filter-element-select",
          "weapon_select": "filter-weapon-type-select",
          "clear": "filters-clear-button"
        }
      }
    },
    "encounter_sections": {
      "component": "shadcn Accordion",
      "behavior": "Encounters are sequential; show encounter number + boss name + completion progress.",
      "classes": "rounded-xl border border-white/10 bg-white/5",
      "testids": {
        "accordion": "encounters-accordion",
        "encounter_item": "encounter-accordion-item"
      }
    },
    "progress": {
      "component": "shadcn Progress",
      "style": "Thin HUD bar with glow on fill; show numeric label (e.g., 12/24).",
      "classes": {
        "track": "h-2 rounded-full bg-white/10",
        "fill": "bg-[hsl(var(--primary))] shadow-[0_0_18px_var(--hud-glow-strong)]"
      },
      "testids": {
        "activity_progress": "activity-completion-progress",
        "checklist_progress": "checklist-overall-progress"
      }
    },
    "item_detail_modal": {
      "component": "shadcn Dialog",
      "layout": "Left: large icon + rarity frame; Right: details + drop sources list + obtained toggle.",
      "classes": "max-w-3xl",
      "testids": {
        "modal": "item-detail-modal",
        "close": "item-detail-close-button"
      }
    },
    "loading_empty_error": {
      "skeletons": {
        "component": "shadcn Skeleton",
        "pattern": "Use skeleton grids matching loot grid; keep shimmer subtle (opacity only).",
        "testids": {
          "loading": "loading-skeleton"
        }
      },
      "empty_state": {
        "visual": "Panel with icon + short copy + clear filters CTA.",
        "classes": "rounded-xl border border-white/10 bg-white/5 p-8 text-center",
        "testids": {
          "empty": "empty-state"
        }
      },
      "error_state": {
        "visual": "Alert component with retry button.",
        "component": "shadcn Alert",
        "testids": {
          "error": "error-state",
          "retry": "error-retry-button"
        }
      }
    }
  },
  "page_blueprints": {
    "home": {
      "hero": {
        "layout": "Left-aligned hero with search + quick category chips; right side shows featured activity + stats.",
        "height_rule": "Hero background gradient band max 18–20vh.",
        "components": [
          "Input (search)",
          "Tabs or Badge chips (categories)",
          "Card (featured)",
          "Progress (collection summary)"
        ],
        "testids": {
          "hero": "home-hero",
          "featured": "home-featured-activity"
        }
      },
      "categories": {
        "layout": "Bento grid of activity categories with counts.",
        "components": [
          "ActivityCard"
        ]
      }
    },
    "activities_browse": {
      "layout": "Tabs at top; grid of ActivityCards; sticky filters on desktop.",
      "components": [
        "Tabs",
        "FiltersBar",
        "Card"
      ],
      "testids": {
        "page": "activities-page"
      }
    },
    "activity_detail": {
      "layout": "Top: activity header panel with artwork strip + progress. Below: encounters accordion with loot grids.",
      "components": [
        "Card",
        "Accordion",
        "LootItemCard",
        "Progress"
      ],
      "testids": {
        "page": "activity-detail-page"
      }
    },
    "search_results": {
      "layout": "Left: filters panel (collapsible on mobile). Right: results grid + sort.",
      "components": [
        "Sheet (mobile filters)",
        "Select",
        "Checkbox",
        "LootItemCard"
      ],
      "testids": {
        "page": "search-page",
        "results": "search-results-grid"
      }
    },
    "checklist_tracker": {
      "layout": "Top summary (overall progress). Below: per-activity progress cards + quick jump.",
      "components": [
        "Progress",
        "Card",
        "Table (optional for dense view)",
        "Checkbox"
      ],
      "testids": {
        "page": "checklist-page"
      }
    }
  },
  "motion_and_microinteractions": {
    "library": {
      "recommended": "framer-motion",
      "install": "npm i framer-motion",
      "usage_notes": [
        "Use for page transitions, accordion entrance, and loot card hover polish.",
        "Respect prefers-reduced-motion; disable parallax and large motion."
      ]
    },
    "principles": [
      "No universal transition: never use transition-all.",
      "Hover should feel like a HUD focusing: slight lift + border brighten + glow increase.",
      "Use 120–180ms for hover, 220–320ms for modal/route transitions.",
      "Use subtle parallax only in hero background (translateY 6–12px max)."
    ],
    "tailwind_motion_snippets": {
      "card_hover": "transition-colors duration-150 hover:bg-white/7 hover:border-white/20",
      "focus_ring": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "press": "active:scale-[0.98]"
    }
  },
  "accessibility": {
    "requirements": [
      "WCAG AA contrast: ensure text-muted-foreground still readable on panel backgrounds.",
      "Do not encode rarity/element by color alone: add label text + icon + border thickness.",
      "Keyboard navigation: Dialog, Tabs, Command must be fully operable.",
      "Focus states must be visible on dark surfaces (ring uses --ring).",
      "Respect prefers-reduced-motion."
    ],
    "aria_and_labels": [
      "All icon-only buttons must have aria-label.",
      "Search input must have label (visually hidden ok)."
    ]
  },
  "performance_notes": [
    "Loot grids can be large: prefer virtualization later (react-virtual) if needed.",
    "Use <img loading='lazy'> for Bungie icons; reserve space with aspect-square wrappers.",
    "Avoid heavy box-shadows on hundreds of cards; keep glow subtle and conditional on hover."
  ],
  "image_urls": {
    "backgrounds": [
      {
        "category": "app-background",
        "description": "Starfield/nebula base layer (use low opacity 0.25–0.4)",
        "url": "https://images.unsplash.com/photo-1607499699372-7bb722dff7e2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwxfHxkYXJrJTIwc3BhY2UlMjBuZWJ1bGElMjBiYWNrZ3JvdW5kJTIwc3RhcnN8ZW58MHx8fGJsdWV8MTc4NTgyMDc3M3ww&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "hero-background-alt",
        "description": "Secondary nebula option for hero band",
        "url": "https://images.unsplash.com/photo-1608925087416-d8b70c782b96?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzN8MHwxfHNlYXJjaHwyfHxkYXJrJTIwc3BhY2UlMjBuZWJ1bGElMjBiYWNrZ3JvdW5kJTIwc3RhcnN8ZW58MHx8fGJsdWV8MTc4NTgyMDc3M3ww&ixlib=rb-4.1.0&q=85"
      }
    ],
    "textures": [
      {
        "category": "panel-texture-reference",
        "description": "Optional subtle panel texture reference (use as inspiration; do not overuse)",
        "url": "https://images.unsplash.com/photo-1610689096391-801034c438fc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwxfHxkYXJrJTIwc2NpJTIwZmklMjB0ZXh0dXJlJTIwcGFuZWx8ZW58MHx8fGJsYWNrfDE3ODU4MjA3Nzl8MA&ixlib=rb-4.1.0&q=85"
      }
    ]
  },
  "instructions_to_main_agent": {
    "global_css_changes": [
      "In /app/frontend/src/index.css: set the app to dark-first by default (apply .dark on html/body or root wrapper).",
      "Replace current :root and .dark tokens with the provided tokens_hsl_for_index_css.root_dark values (keep format 'H S% L%').",
      "Add extended CSS custom properties under .dark (or :root if always-dark) for HUD overlays: --hud-grid, --panel, shadows, noise opacity.",
      "Remove/ignore /app/frontend/src/App.css centering header styles; do not use .App { text-align:center }."
    ],
    "tailwind_usage": [
      "Use bg-background/text-foreground everywhere; panels use bg-white/5 or bg-[color:var(--panel)] with border-white/10.",
      "Never use transition-all; use transition-colors/opacity/shadow only.",
      "Use data attributes for states: data-[obtained=true], data-[rarity=exotic], etc."
    ],
    "rarity_frame_implementation": [
      "Implement a helper mapping rarity -> CSS vars: style={{'--rarity-border': 'rgba(...)', '--rarity-glow': 'rgba(...)'}}.",
      "Add a small corner notch using pseudo-element or an absolutely positioned div (top-right) with clip-path polygon to feel like Destiny HUD.",
      "Do not rely on purple gradients; rarity purple is allowed as a solid border/glow only."
    ],
    "testing_attributes": [
      "Add data-testid to: all buttons, links, inputs, selects, checkboxes, tabs triggers, accordion triggers, modal close, retry buttons, and key info labels (progress text, empty state).",
      "Use kebab-case role-based ids (e.g., data-testid='loot-item-toggle-obtained')."
    ],
    "iconography": [
      "Use lucide-react icons only (already installed). Avoid emoji icons.",
      "Element icons can be simple glyphs (Zap for Arc, Flame for Solar, CircleDot for Void, Snowflake for Stasis, Leaf for Strand, Dot for Kinetic) with aria-label + tooltip."
    ]
  },
  "appendix_general_ui_ux_design_guidelines": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
