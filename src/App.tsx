import { useEffect, useRef } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useSarvamEnvBootstrap } from "@/hooks/use-sarvam-env";
import { getAgentByHostname, getEnvWebAgents } from "@/lib/sarvam/agents";
import { AskAIPage } from "@/pages/AskAIPage";
import { ClaimCreditsPage } from "@/pages/ClaimCreditsPage";
import { OneShutPage } from "@/pages/OneShutPage";
import { UserDetailsPage } from "@/pages/UserDetailsPage";
import { VoiceStudioPage } from "@/pages/VoiceStudioPage";

export function App() {
  const hostAgent = getAgentByHostname(
    getEnvWebAgents(),
    window.location.hostname,
  );

  // Dedicated agent subdomains (e.g. pondpro.naavya.ai) keep their own simple flow
  if (hostAgent) {
    return (
      <>
        <AnalyticsTracker />
        <Routes>
          <Route path="/" element={<UserDetailsPage nextPath="/studio" />} />
          <Route
            path="/studio"
            element={<VoiceStudioPage lockedAgentId={hostAgent.id} entryPath="/" />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <AnalyticsTracker />
      <Routes>
        {/* Primary landing: all JMS products */}
        <Route path="/" element={<OneShutPage />} />
        <Route path="/onesuite" element={<OneShutPage />} />
        <Route path="/onesuit" element={<Navigate to="/" replace />} />
        <Route path="/oneshut" element={<Navigate to="/" replace />} />
        <Route path="/claim-credits" element={<ClaimCreditsPage />} />
        <Route path="/ask-ai" element={<AskAIPage />} />

        {/* Voice AI experience */}
        <Route element={<CredentialsBootstrap />}>
          <Route
            path="/voiceai"
            element={<UserDetailsPage nextPath="/voiceai/studio" backPath="/" />}
          />
          <Route path="/voiceai/studio" element={<VoiceStudioPage />} />
          <Route path="/voiceai/agent/:slug" element={<VoiceStudioPage />} />
          <Route path="/pondpro" element={<VoiceStudioPage initialAgentId="pondpro" />} />
        </Route>

        {/* Legacy paths */}
        <Route path="/studio" element={<Navigate to="/voiceai/studio" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function AnalyticsTracker() {
  const location = useLocation();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const w = window as unknown as {
        dataLayer?: Record<string, unknown>[];
      };
      w.dataLayer = w.dataLayer || [];
      w.dataLayer.push({
        event: "page_view",
        page_path: `${location.pathname}${location.search}${location.hash}`,
        page_location: window.location.href,
        page_title: document.title,
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search, location.hash]);

  return null;
}

function CredentialsBootstrap() {
  useSarvamEnvBootstrap();
  return <Outlet />;
}
