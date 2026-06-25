import { NavLink } from 'react-router-dom'

export default function AppBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-[18px] h-[56px] px-[22px] bg-[rgba(255,255,255,0.86)] backdrop-blur-[8px] backdrop-saturate-[1.4] border-b-[0.5px] border-line">
      <span className="flex items-center gap-[9px] font-semibold text-[15px] tracking-[-0.01em]">
        <span className="w-[22px] h-[22px] rounded-[6px] bg-brand grid place-items-center text-white text-[13px] font-bold">
          C
        </span>
        CareSync
      </span>
      <nav className="flex gap-[2px] ml-[6px]" aria-label="Primary">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `px-[11px] py-[6px] rounded-sm text-[13.5px] font-medium no-underline ${
              isActive ? 'text-brand-ink bg-brand-bg' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`
          }
        >
          Queue
        </NavLink>
        <NavLink
          to="/patient/rajesh-kumar"
          className={({ isActive }) =>
            `px-[11px] py-[6px] rounded-sm text-[13.5px] font-medium no-underline ${
              isActive ? 'text-brand-ink bg-brand-bg' : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
            }`
          }
        >
          Patient
        </NavLink>
      </nav>
      <div className="ml-auto flex items-center gap-[12px]">
        <span className="flex items-center gap-[8px] text-[13px] text-ink-2">
          <span className="w-[26px] h-[26px] rounded-full bg-surface-2 grid place-items-center text-[11px] font-semibold text-ink-2">
            PR
          </span>
          Priya R · coordinator
        </span>
      </div>
    </header>
  )
}
