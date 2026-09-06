"use client";

import { useEffect } from "react";
import OneSignal from "react-onesignal";
import { supabase } from "../lib/supabase";

let oneSignalInitPromise: Promise<void> | null = null;

export default function OneSignalProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || "";
        if (!appId) {
          console.warn("OneSignal App ID is missing. Push notifications will not be initialized.");
          return;
        }

        const isLocalhost =
          window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

        if (process.env.NODE_ENV !== "production" || isLocalhost) {
          console.info("OneSignal initialization skipped in local development.");
          return;
        }

        // Prevent duplicate initialization calls in React StrictMode / hot-reloads
        if (!oneSignalInitPromise) {
          oneSignalInitPromise = OneSignal.init({
            appId,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: true,
            } as any,
          });
        }

        await oneSignalInitPromise;
        console.log("OneSignal initialized successfully");

        // Sync auth state with OneSignal safely
        const syncUser = async (userId: string | undefined) => {
          try {
            if (userId) {
              const currentExternalId = OneSignal.User.externalId;
              if (currentExternalId !== userId) {
                await OneSignal.login(userId);
              }
            } else {
              await OneSignal.logout();
            }
          } catch (loginErr) {
            // Suppress duplicate identity link conflicts (409)
            console.debug("OneSignal auth sync status:", loginErr);
          }
        };

        const { data: { session } } = await supabase.auth.getSession();
        await syncUser(session?.user?.id);

        // Listen for future auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          await syncUser(session?.user?.id);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error("Error initializing OneSignal:", err);
      }
    };

    initOneSignal();
  }, []);

  return <>{children}</>;
}

