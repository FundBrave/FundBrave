import React from "react";
import Image from "next/image"; 
// import gsap from "gsap";

function Navbar() {
  return (
    <nav className="bg-[#09011a] relative w-full" data-node-id="361:1047">
      <div className="relative w-full">
        <div
          className="absolute flex gap-[46px] h-20 items-center justify-center left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: "calc(50% - 0.5px)" }}
          data-node-id="361:1561"
        >
          {/* Logo */}
          <div
            className="h-11 overflow-clip relative shrink-0 w-[146px]"
            data-node-id="361:1580"
          >
            
          </div>
          {/* Search */}
          <div
            className="bg-[#221a31] flex flex-col gap-2.5 h-14 items-start justify-center px-4 py-3 rounded-[12px] shrink-0 w-[343px]"
            data-node-id="361:1563"
          >
            <div className="flex gap-2 items-center" data-node-id="361:1564">
              <Image
                alt="FundBrave Logo"
                className="block max-w-none w-full h-full"
                height={100}
                width={100}
                src={"none"}
              />
              <span className="text-[#b5b5b5] text-[16px] tracking-[0.64px]">
                Type to Search
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <div
            className="flex gap-6 items-start justify-center"
            data-node-id="361:1568"
          >
            <div
              className="flex flex-col gap-0.5 items-center w-[39px]"
              data-node-id="361:1569"
            >
              <span className="text-white text-[16px] font-bold tracking-[1.28px]">
                Feed
              </span>
              <div className="bg-white h-[3px] rounded-[12px] w-[15px]" />
            </div>
            <span className="text-[#b5b5b5] text-[16px] font-semibold tracking-[1.28px]">
              Campaigns
            </span>
            <span className="text-[#b5b5b5] text-[16px] font-semibold tracking-[1.28px]">
              Leaderboard
            </span>
            <span className="text-[#b5b5b5] text-[16px] font-semibold tracking-[1.28px]">
              Community
            </span>
          </div>

          {/* Buttons */}
          <div
            className="flex gap-4 items-center justify-center"
            data-node-id="361:1575"
          >
            <div className="flex gap-2.5 items-center justify-center px-[38px] py-[18px] rounded-[20px] shadow-[0px_8px_30px_0px_rgba(97,36,243,0.35)] shrink-0">
              <span className="text-white text-[16px] font-semibold tracking-[0.64px]">
                Get Started
              </span>
            </div>
            <div className="backdrop-blur-[18.1px] bg-[rgba(69,12,240,0.1)] flex gap-2.5 items-center justify-center px-[38px] py-[18px] rounded-[20px] shrink-0 relative">
              <div
                aria-hidden="true"
                className="absolute border border-[#450cf0] inset-0 pointer-events-none rounded-[20px] shadow-[0px_8px_30px_0px_rgba(29,5,82,0.35)]"
              />
              <span className="text-white text-[16px] font-semibold tracking-[0.64px]">
                Sign In
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute border-b border-[rgba(232,232,232,0.1)] inset-0 pointer-events-none"
      />
    </nav>
  );
}

export default Navbar;
