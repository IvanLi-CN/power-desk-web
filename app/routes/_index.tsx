import { Outlet } from "@remix-run/react";

export default function Index() {
  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Hello</h1>
      <Outlet />
    </div>
  );
}
