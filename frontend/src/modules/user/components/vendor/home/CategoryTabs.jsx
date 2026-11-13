import React from 'react';

const CategoryTabs = ({ tabs, activeTab, onTabClick }) => {
  return (
    <div className="mt-6 pb-2 md:max-w-[1600px] md:mx-auto">
      <div 
        className="flex overflow-x-auto gap-3.5 px-4 no-scrollbar pt-2 pb-4 md:justify-center md:gap-6 md:overflow-x-visible md:px-0" 
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.label;

          if (tab.label === 'You Buy') {
            return (
              <div 
                key={idx} 
                onClick={() => onTabClick(tab.label)}
                className="flex-shrink-0 w-[80px] sm:w-[95px] flex flex-col items-center cursor-pointer group"
              >
                {/* Rounded Square Card exactly like the mockup image */}
                <div 
                  className={`w-full h-[96px] sm:h-[112px] rounded-[20px] overflow-hidden flex flex-col items-center justify-between p-1.5 transition-all duration-300 border relative ${
                    isActive 
                      ? 'bg-[color:var(--fg-light,#FFF8EE)] border-2 border-[color:var(--mk-primary,#6FAE4A)] shadow-[0_4px_12px_rgba(62,90,68,0.15)] scale-[1.01]' 
                      : 'bg-[#FFFBF7]/90 border border-[#EADCC9]/60 shadow-[0_3px_8px_rgba(61,35,20,0.015)] hover:border-[color:var(--mk-primary,#6FAE4A)]/40 hover:shadow-[0_6px_15px_rgba(61,35,20,0.04)]'
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 2h1v1H2zm4 4h1v1H6z' fill='%23EADCC9' fill-opacity='0.15'/%3E%3C/svg%3E")`,
                    backgroundSize: '10px 10px',
                  }}
                >
                  {/* Dashed Circle with Shopping Bag + Flowers */}
                  <div className="relative w-[40px] h-[40px] sm:w-[48px] sm:h-[48px] rounded-full border border-dashed border-[color:var(--mk-primary,#6FAE4A)]/75 bg-[#FFFBF7] flex items-center justify-center mt-3 shadow-3xs">
                    
                    {/* Shopping Bag with White Heart Cutout */}
                    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]" fill="#6FAE4A">
                      {/* Handle */}
                      <path d="M12 2C9.5 2 7.5 4 7.5 6.5H9c0-1.7 1.3-3 3-3s3 1.3 3 3h1.5C16.5 4 14.5 2 12 2z" />
                      {/* Bag body */}
                      <path d="M5 6.5h14c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2z" />
                      {/* White heart cutout */}
                      <path d="M12 16.8s-2.2-1.8-2.7-2.3c-.7-.7-1-1.3-1-1.8 0-1.2 1-2.2 2.2-2.2.7 0 1.3.4 1.5 1 .2-.6.8-1 1.5-1 1.2 0 2.2 1 2.2 2.2 0 .5-.3 1.1-1 1.8-.5.5-2.7 2.3-2.7 2.3z" fill="white" />
                    </svg>

                    {/* Top-Right Orange Flower Decoration */}
                    <div className="absolute -top-[6px] -right-[6px] w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible">
                        <circle cx="12" cy="12" r="5.5" fill="#E26D22" />
                        <circle cx="12" cy="5" r="5.5" fill="#E26D22" />
                        <circle cx="12" cy="19" r="5.5" fill="#E26D22" />
                        <circle cx="5" cy="12" r="5.5" fill="#E26D22" />
                        <circle cx="19" cy="12" r="5.5" fill="#E26D22" />
                        <circle cx="12" cy="12" r="2.2" fill="#6FAE4A" />
                      </svg>
                    </div>

                    {/* Bottom-Left small flower stem decoration */}
                    <div className="absolute -left-[6px] bottom-[4px] flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E26D22] shadow-3xs" />
                      <span className="w-1.5 h-[1.5px] bg-[color:var(--mk-primary,#6FAE4A)] rotate-12" />
                    </div>

                    {/* Bottom-Right small flower stem decoration */}
                    <div className="absolute -right-[6px] bottom-[4px] flex items-center gap-0.5">
                      <span className="w-1.5 h-[1.5px] bg-[color:var(--mk-primary,#6FAE4A)] -rotate-12" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E26D22] shadow-3xs" />
                    </div>
                  </div>

                  {/* Category Label at bottom */}
                  <div className="flex flex-col items-center mt-2.5 mb-1.5 w-full">
                    <span 
                      className={`text-[9.5px] sm:text-[10.5px] font-black text-center px-0.5 leading-tight tracking-tight flex items-center justify-center transition-colors ${
                        isActive ? 'text-[color:var(--mk-primary,#6FAE4A)]' : 'text-[#3F2A20]'
                      }`}
                    >
                      {tab.label}
                    </span>

                    {/* Thick bottom line indicator */}
                    <div 
                      className={`w-6 h-[2px] sm:w-8 sm:h-[3px] bg-[color:var(--mk-primary,#6FAE4A)] rounded-full mt-1.5 transition-opacity duration-300 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`} 
                    />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={idx} 
              onClick={() => onTabClick(tab.label)}
              className="flex-shrink-0 w-[80px] sm:w-[95px] flex flex-col items-center cursor-pointer group"
            >
              {/* Rounded Square Card containing both text (top) and image (bottom) */}
              <div 
                className={`w-full h-[96px] sm:h-[112px] rounded-[20px] overflow-hidden flex flex-col items-center justify-between p-1.5 transition-all duration-300 ${
                  isActive 
                    ? 'bg-white border-2 border-[color:var(--mk-primary,#6FAE4A)] shadow-[0_4px_12px_rgba(62,90,68,0.1)]' 
                    : 'bg-white border border-[#EADCC9]/60 shadow-[0_3px_8px_rgba(61,35,20,0.015)] hover:border-[color:var(--mk-primary,#6FAE4A)]/40 hover:shadow-[0_6px_15px_rgba(61,35,20,0.04)]'
                }`}
              >
                {/* Category Label at top */}
                <span 
                  className={`text-[9.5px] sm:text-[10.5px] font-black text-center mt-2 px-0.5 leading-tight tracking-tight h-[20px] flex items-center justify-center transition-colors ${
                    isActive ? 'text-[color:var(--mk-primary,#6FAE4A)]' : 'text-[#3F2A20]'
                  }`}
                >
                  {tab.label}
                </span>
                
                {/* Category Image at bottom inside a rounded square */}
                {tab.img && (
                  <div className="w-[88%] aspect-square rounded-[14px] overflow-hidden bg-[#FAF9F5] border border-[#EADCC9]/40 flex items-center justify-center p-0.5 mb-1.5 relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.02)]">
                    <img
                      src={tab.img}
                      alt={tab.label}
                      className="w-full h-full object-cover rounded-[11px] group-hover:scale-[1.04] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(CategoryTabs);
