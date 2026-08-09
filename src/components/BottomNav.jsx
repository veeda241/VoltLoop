import React from "react";
import { NavLink, useLocation } from "react-router-dom";

function Icon({ children }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const ICONS = {
  Home: (
    <Icon>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </Icon>
  ),
  Map: (
    <Icon>
      <path d="M9 4 3 6.5v13.5L9 18l6 2.5 6-2.5V4.5L15 7 9 4Z" />
      <path d="M9 4v14M15 7v13.5" />
    </Icon>
  ),
  Offers: (
    <Icon>
      <path d="M4 9h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
      <path d="M8 9V7a4 4 0 0 1 8 0v2" />
    </Icon>
  ),
  Charge: (
    <Icon>
      <path d="M13 2 4 14h7l-1 8 10-14h-7l1-6Z" />
    </Icon>
  ),
  Wallet: (
    <Icon>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  ),
  Mesh: (
    <Icon>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="7" r="2" />
      <circle cx="18" cy="17" r="2" />
      <path d="M8 12h8M16.2 8.6 8.8 11.2M16.2 15.4 8.8 12.8" />
    </Icon>
  ),
  Legal: (
    <Icon>
      <path d="M7 4h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      <path d="M14 4v4h4M8 12h8M8 16h6" />
    </Icon>
  ),
  Orders: (
    <Icon>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </Icon>
  ),
  Stations: (
    <Icon>
      <rect x="5" y="3" width="10" height="18" rx="1.5" />
      <path d="M15 8h3a2 2 0 0 1 2 2v7a1.5 1.5 0 1 1-3 0v-4h-2" />
    </Icon>
  ),
};

export default function BottomNav({ items }) {
  const loc = useLocation();
  if (!items?.length) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[60] border-t border-gold/25 bg-bg/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile"
    >
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active =
            loc.pathname === item.href || (item.href !== "/" && loc.pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium ${
                  active ? "text-volt" : "text-muted"
                }`}
              >
                {ICONS[item.icon] || ICONS.Home}
                <span className="max-w-full truncate">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
