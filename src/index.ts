import express from "express";
import http from "node:http";
import https from "node:https";
import type {Express} from 'express-serve-static-core';

import type {IConfig} from "./config";
import defaultConfig from "./config";
import type {PeerServerEvents} from "./instance";
import {createInstance} from "./instance";

export type {MessageType} from "./enums"

function ExpressPeerServer(server: https.Server | http.Server, options?: Partial<IConfig>) {
  const app = express();

  const newOptions: IConfig = {
    ...defaultConfig,
    ...options
  };

  if (newOptions.proxied) {
    app.set("trust proxy", newOptions.proxied === "false" ? false : !!newOptions.proxied);
  }

  app.on("mount", () => {
    if (!server) {
      throw new Error("Server is not passed to constructor - " +
        "can't start PeerServer");
    }

    createInstance({ app, server, options: newOptions });
  });

	return app as Express & PeerServerEvents
}

function PeerServer(options: Partial<IConfig> = {}, callback?: (server: https.Server | http.Server) => void) {
  const app = express();

  let newOptions: IConfig = {
    ...defaultConfig,
    ...options
  };

  const port = newOptions.port;
  const host = newOptions.host;

  let server: https.Server | http.Server;

  const { ssl, ...restOptions } = newOptions;
  if (ssl && Object.keys(ssl).length) {
    server = https.createServer(ssl, app);

    newOptions = restOptions;
  } else {
    server = http.createServer(app);
  }

  const peerjs = ExpressPeerServer(server, newOptions);
  app.use(peerjs);

  server.listen(port, host, () => callback?.(server));

  return peerjs;
}

export {
  ExpressPeerServer,
  PeerServer
};
