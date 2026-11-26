import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useSarvamEnvBootstrap } from "@/hooks/use-sarvam-env";
import { getAgentByHostname, getEnvWebAgents } from "@/lib/sarvam/agents";
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
      <Routes>
        <Route path="/" element={<UserDetailsPage nextPath="/studio" />} />
        <Route
          path="/studio"
          element={<VoiceStudioPage lockedAgentId={hostAgent.id} entryPath="/" />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      {/* Primary landing: all JMS products */}
      <Route path="/" element={<OneShutPage />} />
      <Route path="/onesuit" element={<OneShutPage />} />
      <Route path="/oneshut" element={<Navigate to="/" replace />} />
      <Route path="/claim-credits" element={<ClaimCreditsPage />} />

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
  );
}

function CredentialsBootstrap() {
  useSarvamEnvBootstrap();
  return <Outlet />;
}
