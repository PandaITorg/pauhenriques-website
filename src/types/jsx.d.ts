declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: React.HTMLAttributes<HTMLElement> & {
      [key: string]: string | number | boolean | null | undefined;
    };
  }
}
