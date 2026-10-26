/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { AccessToken } from "@itwin/core-bentley";
import { BrowserAuthorizationClient } from "@itwin/browser-authorization";
import { IModelApp } from "@itwin/core-frontend";
import { getConfigurationString } from "./TypeStation";

/**
 * Wraps the signIn process.
 * @return Promise that resolves to true after signIn is complete.
 */
export async function signIn(): Promise<boolean> {
  const existingAuthClient = IModelApp.authorizationClient;
  if (existingAuthClient instanceof BrowserAuthorizationClient) {
    if (existingAuthClient.isAuthorized)
      return (await existingAuthClient.getAccessToken()) !== undefined;

    return new Promise<boolean>((resolve, reject) => {
      existingAuthClient.onAccessTokenChanged.addOnce((token: AccessToken) => resolve(!!token));
      existingAuthClient.signIn().catch((err: Error) => reject(err));
    });
  }

  const clientId = getConfigurationString("oidcClientId") ?? "imodeljs-spa-test";
  const redirectUri = getConfigurationString("oidcRedirectUri") ?? "http://localhost:3000/signin-callback";
  const scope = getConfigurationString("oidcScope") ?? "projects:read realitydata:read imodels:read imodels:modify imodelaccess:read";
  const responseType = "code";
  const authClient = new BrowserAuthorizationClient({
    clientId,
    redirectUri,
    scope,
    responseType,
  });

  try {
    await authClient.signInSilent();
  } catch { /* no existing session - a full sign in is required */ }

  IModelApp.authorizationClient = authClient;
  if (authClient.isAuthorized)
    return true;

  return new Promise<boolean>((resolve, reject) => {
    authClient.onAccessTokenChanged.addOnce((token: AccessToken) => resolve(!!token));
    authClient.signIn().catch((err: Error) => reject(err));
  });
}

/** Signs out of the authorization client, if one is in use. */
export async function signOut(): Promise<void> {
  const auth = IModelApp.authorizationClient;
  if (auth instanceof BrowserAuthorizationClient) {
    await auth.signOut();
    IModelApp.authorizationClient = undefined;
  }
}
