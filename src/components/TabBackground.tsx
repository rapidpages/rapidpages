export const TabBackground = () => {
  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <defs>
        <symbol id="chrome-tab-geometry-left" viewBox="0 0 214 35">
          <path d="M17 0h197v36H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z"></path>
        </symbol>
        <symbol id="chrome-tab-geometry-right" viewBox="0 0 214 36">
          <use xlinkHref="#chrome-tab-geometry-left"></use>
        </symbol>
        <clipPath id="crop">
          <rect className="mask" width="100%" height="100%" x="0"></rect>
        </clipPath>
      </defs>
      <svg width="52%" height="100%">
        <use
          xlinkHref="#chrome-tab-geometry-left"
          width="214"
          height="36"
          className="fill-gray-200 stroke-gray-300 stroke-1"
        ></use>
      </svg>
      <g transform="scale(-1, 1)">
        <svg width="52%" height="100%" x="-100%" y="0">
          <use
            xlinkHref="#chrome-tab-geometry-right"
            width="214"
            height="36"
            className="fill-gray-200 stroke-gray-300 stroke-1"
          ></use>
        </svg>
      </g>
    </svg>
  );
};
