import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Gauge,
  Layers3,
  Loader2,
  Play,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AdaptiveContractInputProfile,
  getGetAdaptiveContractQueryKey,
  getGetProjectQueryKey,
  getListTestProfilesQueryKey,
  getListTestRunsQueryKey,
  Project,
  TestProfile,
  TestRunInputMethod,
  useCreateTestRun,
  useGetAdaptiveContract,
  useGetProject,
  useListTestProfiles,
  useListTestRuns,
  useUpsertAdaptiveContract,
} from '@workspace/api-client-react';
import { AppShell, SectionHeading, StatusDot } from '@/components/app-shell';

type ContractForm = {
  profile: 'low' | 'medium' | 'high';
  networkProfile: string;
  imagePolicy: string;
  javascriptPolicy: string;
  featurePolicy: string;
  maxResourceSizeKb: number;
  maxLcpMs: number;
};

const fallbackContract: ContractForm = {
  profile: AdaptiveContractInputProfile.medium,
  networkProfile: 'Fast 3G',
  imagePolicy: 'medium',
  javascriptPolicy: 'deferred',
  featurePolicy: 'normal',
  maxResourceSizeKb: 1400,
  maxLcpMs: 3000,
};

const methodOptions: Array<{
  value: TestRunInputMethod;
  label: string;
  description: string;
}> = [
  {
    value: 'adaptive_behavior',
    label: 'Adaptive behavior',
    description: 'Check graceful behavior when network and resource conditions change.',
  },
  {
    value: 'performance',
    label: 'Performance',
    description: 'Compare the SUT against the selected LCP and resource budgets.',
  },
  {
    value: 'resource',
    label: 'Resource',
    description: 'Inspect image, script, and network resource behavior.',
  },
  {
    value: 'full_validation',
    label: 'Full validation',
    description: 'Queue the complete validation suite for this project.',
  },
];

function formatMethod(method: string) {
  return method
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function ProjectContext({ project }: { project?: Project }) {
  if (!project) return null;
  return (
    <div className="mb-7 flex flex-wrap items-center gap-2 text-xs text-[#6d818a]">
      <Link
        href={`/projects/${project.id}`}
        className="inline-flex items-center gap-1.5 font-semibold text-[#55717d] hover:text-[#168a7a]"
        data-testid="link-phase-two-project"
      >
        <ArrowLeft size={14} /> {project.name}
      </Link>
      <ChevronRight size={13} className="text-[#afbec3]" />
      <span>{project.applicationUrl}</span>
    </div>
  );
}

function QueryError({ message }: { message: string }) {
  return (
    <div
      className="mt-6 flex items-center gap-3 rounded-md border border-[#f0c7c1] bg-[#fff6f4] px-4 py-3 text-xs text-[#a14c40]"
      data-testid="error-phase-two"
    >
      <CircleAlert size={16} />
      {message}
    </div>
  );
}

export function ContractPage() {
  const { id = '' } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const projectQuery = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) },
  });
  const contractQuery = useGetAdaptiveContract(id, {
    query: { enabled: !!id, queryKey: getGetAdaptiveContractQueryKey(id) },
  });
  const profilesQuery = useListTestProfiles({
    query: { queryKey: getListTestProfilesQueryKey() },
  });
  const saveContract = useUpsertAdaptiveContract();
  const [form, setForm] = useState<ContractForm>(fallbackContract);
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initialized || !profilesQuery.data) return;
    const contract = contractQuery.data;
    const profile = profilesQuery.data.find((item) => item.key === 'medium');
    if (contract) {
      setForm({
        profile: contract.profile,
        networkProfile: contract.networkProfile,
        imagePolicy: contract.imagePolicy,
        javascriptPolicy: contract.javascriptPolicy,
        featurePolicy: contract.featurePolicy,
        maxResourceSizeKb: contract.maxResourceSizeKb,
        maxLcpMs: contract.maxLcpMs,
      });
      setInitialized(true);
    } else if (profile) {
      chooseProfileFromData(profile);
      setInitialized(true);
    }
  }, [contractQuery.data, initialized, profilesQuery.data]);

  const chooseProfileFromData = (profile: TestProfile) => {
    setForm({
      profile: profile.key,
      networkProfile: profile.networkProfile,
      imagePolicy: profile.imagePolicy,
      javascriptPolicy: profile.javascriptPolicy,
      featurePolicy: profile.featurePolicy,
      maxResourceSizeKb: profile.maxResourceSizeKb,
      maxLcpMs: profile.maxLcpMs,
    });
  };

  const chooseProfile = (profile: TestProfile) => {
    chooseProfileFromData(profile);
    setSaved(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveContract.mutate(
      { id, data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdaptiveContractQueryKey(id) });
          setSaved(true);
        },
      },
    );
  };

  const profiles = profilesQuery.data ?? [];
  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px] p-5 md:p-9">
        <ProjectContext project={projectQuery.data} />
        <SectionHeading
          eyebrow="Project / Adaptive contract"
          title="Define the resilience boundary"
          detail="Set the conditions and budgets that future test runs will enforce."
          action={
            <Link
              href={`/projects/${id}/tests/new`}
              className="inline-flex items-center gap-2 rounded-md border border-[#cfdde0] bg-white px-3.5 py-2 text-xs font-semibold text-[#466574] hover:bg-[#eef5f4]"
              data-testid="link-contract-new-test"
            >
              Configure a test <Play size={14} />
            </Link>
          }
        />

        {profilesQuery.isLoading ? (
          <div className="mt-8 h-48 animate-pulse rounded-lg bg-[#e5edef]" />
        ) : profiles.length ? (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <section className="rounded-lg border border-[#dce6e8] bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#e5edef] pb-5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[.16em] text-[#1b9c89]">
                    Contract profile
                  </div>
                  <h2 className="mt-1 font-display text-lg font-semibold text-[#173041]">
                    Choose a baseline
                  </h2>
                  <p className="mt-1 max-w-[620px] text-sm leading-6 text-[#82969e]">
                    Profiles are reusable starting points. Adjust the concrete budgets below before saving.
                  </p>
                </div>
                <SlidersHorizontal size={18} className="text-[#1b9c89]" />
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                {profiles.map((profile) => {
                  const selected = form.profile === profile.key;
                  return (
                    <button
                      type="button"
                      key={profile.key}
                      onClick={() => chooseProfile(profile)}
                      className={`text-left rounded-md border p-4 transition ${
                        selected
                          ? 'border-[#2bad98] bg-[#edf8f5] ring-2 ring-[#2bad98]/10'
                          : 'border-[#dce6e8] bg-[#fbfcfc] hover:border-[#a8c9c8]'
                      }`}
                      data-testid={`button-contract-profile-${profile.key}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-[.15em] text-[#1b9c89]">
                          {profile.key}
                        </span>
                        {selected && <Check size={16} className="text-[#1b9c89]" />}
                      </div>
                      <h3 className="mt-3 font-display text-base font-semibold text-[#284653]">
                        {profile.name}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-[#71858e]">{profile.description}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px] text-[#6f858e]">
                        <span>{profile.networkProfile}</span>
                        <span>{profile.maxResourceSizeKb} KB max</span>
                        <span>{profile.javascriptPolicy} JS</span>
                        <span>{profile.maxLcpMs} ms LCP</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-lg border border-[#dce6e8] bg-white p-5 md:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-[#e5edef] pb-5">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[.16em] text-[#1b9c89]">
                    Contract details
                  </div>
                  <h2 className="mt-1 font-display text-lg font-semibold text-[#173041]">
                    Tune the enforcement rules
                  </h2>
                </div>
                <FileCheck2 size={18} className="text-[#1b9c89]" />
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <ReadOnlyField label="Network profile" value={form.networkProfile} />
                <ReadOnlyField label="Image policy" value={form.imagePolicy} />
                <ReadOnlyField label="JavaScript policy" value={form.javascriptPolicy} />
                <ReadOnlyField label="Feature policy" value={form.featurePolicy} />
                <NumberField
                  label="Max resource size (KB)"
                  value={form.maxResourceSizeKb}
                  onChange={(value) => setForm({ ...form, maxResourceSizeKb: value })}
                  testId="input-max-resource-size"
                />
                <NumberField
                  label="Max LCP (ms)"
                  value={form.maxLcpMs}
                  onChange={(value) => setForm({ ...form, maxLcpMs: value })}
                  testId="input-max-lcp"
                />
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[#e5edef] pt-5">
                {saved && (
                  <span className="mr-auto flex items-center gap-2 text-xs font-medium text-[#168a7a]" data-testid="status-contract-saved">
                    <Check size={14} /> Contract saved
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saveContract.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-[#173d4a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#215566] disabled:opacity-60"
                  data-testid="button-save-contract"
                >
                  {saveContract.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save contract
                </button>
              </div>
            </section>
            {saveContract.isError && <QueryError message="The adaptive contract could not be saved." />}
          </form>
        ) : (
          <QueryError message="Test profiles could not be loaded." />
        )}
      </div>
    </AppShell>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.08em] text-[#69808a]">
        {label}
      </span>
      <div className="flex h-10 items-center rounded-md border border-[#e2eaec] bg-[#f7faf9] px-3 text-sm text-[#476470]">
        {value}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  testId: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.08em] text-[#69808a]">
        {label}
      </span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-full rounded-md border border-[#d4e0e3] bg-white px-3 text-sm text-[#233f4d] outline-none focus:border-[#32b7a2] focus:ring-2 focus:ring-[#32b7a2]/15"
        data-testid={testId}
      />
    </label>
  );
}

export function TestRunsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const projectQuery = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) },
  });
  const runsQuery = useListTestRuns(id, {
    query: { enabled: !!id, queryKey: getListTestRunsQueryKey(id) },
  });
  const runs = runsQuery.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-[1120px] p-5 md:p-9">
        <ProjectContext project={projectQuery.data} />
        <SectionHeading
          eyebrow="Project / Test runs"
          title="Test configuration"
          detail="Queue a validation plan now. Execution is introduced in the next phase."
          action={
            <Link
              href={`/projects/${id}/tests/new`}
              className="inline-flex items-center gap-2 rounded-md bg-[#173d4a] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#215566]"
              data-testid="link-new-test-run"
            >
              <Play size={14} /> New test configuration
            </Link>
          }
        />
        <div className="mt-8 rounded-lg border border-[#dce6e8] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5edef] px-5 py-4">
            <div>
              <h2 className="font-display text-[15px] font-semibold text-[#173041]">Run history</h2>
              <p className="mt-1 text-xs text-[#82969e]">No browser execution happens in Phase 2.</p>
            </div>
            <Gauge size={18} className="text-[#1b9c89]" />
          </div>
          {runsQuery.isLoading ? (
            <div className="p-6 text-sm text-[#82969e]">Loading test runs…</div>
          ) : runs.length ? (
            <div className="divide-y divide-[#edf1f2]">
              {runs.map((run) => (
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center" key={run.id} data-testid={`row-test-run-${run.id}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#edf5f4] text-[#1b9c89]">
                    {run.status === 'queued' ? <Clock3 size={16} /> : <Gauge size={16} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#284653]">{formatMethod(run.method)}</span>
                    <span className="mt-1 block text-xs text-[#82969e]">
                      {run.profile.toUpperCase()} profile · queued for future execution
                    </span>
                  </span>
                  <StatusBadge status={run.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-14 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f4] text-[#25a38e]">
                <Layers3 size={18} />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[#294653]">No test runs yet</h3>
              <p className="mx-auto mt-1 max-w-[320px] text-xs leading-5 text-[#82969e]">
                Create a configuration to capture the test plan your future execution engine will run.
              </p>
            </div>
          )}
        </div>
        {runsQuery.isError && <QueryError message="Test runs could not be loaded." />}
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'queued'
      ? 'bg-[#fff4df] text-[#a56b14]'
      : status === 'passed'
        ? 'bg-[#e6f5f2] text-[#168a7a]'
        : status === 'violated' || status === 'failed'
          ? 'bg-[#fff0ed] text-[#a14c40]'
          : 'bg-[#edf1f3] text-[#667b84]';
  return (
    <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[.08em] ${tone}`} data-testid={`status-test-run-${status}`}>
      {status}
    </span>
  );
}

export function NewTestRunPage() {
  const { id = '' } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const projectQuery = useGetProject(id, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id) },
  });
  const profilesQuery = useListTestProfiles({
    query: { queryKey: getListTestProfilesQueryKey() },
  });
  const createRun = useCreateTestRun();
  const [profile, setProfile] = useState<'low' | 'medium' | 'high'>('medium');
  const [method, setMethod] = useState<TestRunInputMethod>('adaptive_behavior');
  const [configuration, setConfiguration] = useState('');
  const [error, setError] = useState('');

  const selectedProfile = useMemo(
    () => profilesQuery.data?.find((item) => item.key === profile),
    [profile, profilesQuery.data],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    let parsedConfiguration: Record<string, unknown> = {};
    if (configuration.trim()) {
      try {
        const candidate: unknown = JSON.parse(configuration);
        if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object') {
          throw new Error('Configuration must be a JSON object.');
        }
        parsedConfiguration = candidate as Record<string, unknown>;
      } catch {
        setError('Optional configuration must be a valid JSON object.');
        return;
      }
    }
    createRun.mutate(
      { id, data: { profile, method, configuration: parsedConfiguration } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTestRunsQueryKey(id) });
          setLocation(`/projects/${id}/tests`);
        },
      },
    );
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[980px] p-5 md:p-9">
        <ProjectContext project={projectQuery.data} />
        <SectionHeading
          eyebrow="Project / New test"
          title="Configure a test run"
          detail="Save a precise test plan without starting execution."
        />
        <form onSubmit={submit} className="mt-8 grid gap-5 lg:grid-cols-[1fr_320px]">
          <section className="rounded-lg border border-[#dce6e8] bg-white p-5 md:p-6">
            <div className="border-b border-[#e5edef] pb-5">
              <div className="font-mono text-[10px] uppercase tracking-[.16em] text-[#1b9c89]">Test definition</div>
              <h2 className="mt-1 font-display text-lg font-semibold text-[#173041]">Choose what to queue</h2>
            </div>
            <div className="mt-6 space-y-6">
              <fieldset>
                <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[.08em] text-[#69808a]">Testing method</legend>
                <div className="grid gap-2">
                  {methodOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition ${
                        method === option.value ? 'border-[#2bad98] bg-[#edf8f5]' : 'border-[#dce6e8] hover:border-[#a8c9c8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="testing-method"
                        value={option.value}
                        checked={method === option.value}
                        onChange={() => setMethod(option.value)}
                        className="mt-1 accent-[#1b9c89]"
                        data-testid={`radio-testing-method-${option.value}`}
                      />
                      <span>
                        <span className="block text-sm font-semibold text-[#284653]">{option.label}</span>
                        <span className="mt-1 block text-xs leading-5 text-[#82969e]">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.08em] text-[#69808a]">Optional configuration JSON</span>
                <textarea
                  value={configuration}
                  onChange={(event) => setConfiguration(event.target.value)}
                  placeholder={'{\n  "route": "/checkout"\n}'}
                  className="min-h-[150px] w-full resize-y rounded-md border border-[#d4e0e3] bg-white p-3 font-mono text-xs text-[#233f4d] outline-none focus:border-[#32b7a2] focus:ring-2 focus:ring-[#32b7a2]/15"
                  data-testid="textarea-test-configuration"
                />
                <span className="mt-1.5 block text-xs text-[#82969e]">Use a JSON object for method-specific options. It is stored but not executed yet.</span>
              </label>
              {error && <QueryError message={error} />}
              {createRun.isError && <QueryError message="The test configuration could not be queued." />}
              <div className="flex justify-end gap-2 border-t border-[#e5edef] pt-5">
                <Link
                  href={`/projects/${id}/tests`}
                  className="inline-flex items-center rounded-md border border-[#d4e0e3] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#55717d]"
                  data-testid="link-cancel-test"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={createRun.isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-[#173d4a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#215566] disabled:opacity-60"
                  data-testid="button-queue-test"
                >
                  {createRun.isPending ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  Queue test configuration
                </button>
              </div>
            </div>
          </section>
          <aside className="rounded-lg border border-[#dce6e8] bg-[#edf6f5] p-5">
            <div className="flex items-center gap-2 text-[#178d7b]">
              <SlidersHorizontal size={16} />
              <span className="text-xs font-semibold">Selected profile</span>
            </div>
            <div className="mt-5 grid gap-2">
              {(profilesQuery.data ?? []).map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setProfile(item.key)}
                  className={`rounded-md border p-3 text-left transition ${
                    profile === item.key ? 'border-[#2bad98] bg-white' : 'border-transparent bg-white/50 hover:bg-white'
                  }`}
                  data-testid={`button-test-profile-${item.key}`}
                >
                  <span className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[.13em] text-[#168a7a]">{item.key}</span>
                    {profile === item.key && <Check size={14} className="text-[#1b9c89]" />}
                  </span>
                  <span className="mt-2 block text-sm font-semibold text-[#345360]">{item.name}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#71858e]">{item.description}</span>
                </button>
              ))}
            </div>
            {selectedProfile && (
              <div className="mt-5 border-t border-[#cde4df] pt-4 font-mono text-[10px] leading-5 text-[#68827c]">
                {selectedProfile.networkProfile} · {selectedProfile.maxResourceSizeKb} KB resources · {selectedProfile.maxLcpMs} ms LCP
              </div>
            )}
          </aside>
        </form>
      </div>
    </AppShell>
  );
}