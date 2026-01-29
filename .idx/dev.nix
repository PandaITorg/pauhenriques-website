{pkgs}: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_20
  ];
  idx.extensions = [
    "dbaeumer.vscode-eslint"
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "sh"
          "-c"
          "npm install && npm run dev -- --port $PORT --hostname 0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}
