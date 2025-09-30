// Footer component
import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-200 text-center py-3 mt-10">
      <p>© {new Date().getFullYear()} Recruitment System</p>
    </footer>
  );
}

export default Footer;
