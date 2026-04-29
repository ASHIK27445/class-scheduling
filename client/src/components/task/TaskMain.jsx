import { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router";
import { Toaster } from "react-hot-toast";
import {C} from "./slotHelpers";


export default function TaskMain() {


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400&family=Public+Sans:wght@400;500;600;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        body { font-family: 'Lexend', sans-serif; background: #f7f9fb; margin:0; }
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-weight: 400; font-style: normal; font-size: 24px; display: inline-block; line-height: 1; text-transform: none; letter-spacing: normal; word-wrap: normal; white-space: nowrap; direction: ltr; }
        @keyframes slideInUp { from { transform: translateY(80px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeOut { to { opacity: 0; transform: translateY(30px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c2c6d3; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #737783; }
      `}</style>
      <div className="min-h-screen flex">
            <Sidebar />


        <div className="flex-1 min-h-screen">
          <main className="p-4 md:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster></Toaster>
    </>
  );
}