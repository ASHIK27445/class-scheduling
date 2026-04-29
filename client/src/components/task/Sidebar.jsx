import { NavLink } from 'react-router';

const Sidebar = () => {
  const navItem = (id, to, icon, label, filled = false) => {
    return (
      <li key={id}>
        <NavLink
          to={to}
          className={({ isActive }) =>
            `w-full flex items-center gap-3 px-4 py-3 font-medium duration-200 ease-in-out border-r-4 cursor-pointer rounded-r-none text-left ${
              isActive
                ? "bg-blue-50 text-blue-700 border-blue-700"
                : "text-slate-500 hover:text-blue-600 hover:bg-white border-transparent"
            }`
          }
          style={{ fontFamily: "'Public Sans', sans-serif" }}
        >
          <span
            className="material-symbols-outlined"
            style={filled ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            {icon}
          </span>
          <span className="text-sm font-medium tracking-wide">{label}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <nav className="flex flex-col h-screen py-6 w-64 border-r border-slate-200 bg-slate-50 overflow-x-hidden">
      <div className="px-6 mb-6 flex flex-col gap-2">
        <span className="text-lg font-black text-blue-900 uppercase tracking-wider" style={{ fontFamily: "'Public Sans', sans-serif" }}>
          Academic Portal
        </span>
        <span className="text-xs text-slate-500" style={{ fontFamily: "'Public Sans', sans-serif" }}>Management System</span>
      </div>
      <ul className="flex-1 flex flex-col gap-1 px-4">
        {navItem("nav-teacher", "/teacher", "dashboard", "Dashboard", true)}
        {navItem("nav-student", "/student", "event_available", "Book a Slot")}
        {navItem("nav-myslots", "/my-slots", "calendar_today", "My Slots")}
        <li className="mt-auto">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 font-medium duration-200 ease-in-out border-r-4 cursor-pointer rounded-r-none ${
                isActive
                  ? "bg-blue-50 text-blue-700 border-blue-700"
                  : "text-slate-500 hover:text-blue-600 hover:bg-white border-transparent"
              }`
            }
            style={{ fontFamily: "'Public Sans', sans-serif" }}
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium tracking-wide">Settings</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;