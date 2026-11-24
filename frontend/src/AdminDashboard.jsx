import { useEffect, useState } from "react";

const EMPTY_DRAFT = {
  title: "",
  companyName: "",
  description: "",
  location: "",
  workMode: "REMOTE",
  durationWeeks: "",
  stipendAmount: "",
  applicationDeadline: "",
  status: "OPEN",
  requiredSkillIds: [],
};

const money = (value) => value === null || value === undefined
  ? "Not specified"
  : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value));

function AdminDashboard({ api, skills = [] }) {
  const [view, setView] = useState("overview");
  const [overview, setOverview] = useState({});
  const [internships, setInternships] = useState([]);
  const [reports, setReports] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh(showLoader = true) {
    if (showLoader) setLoading(true);
    setError("");
    try {
      const [summary, listing, moderation] = await Promise.all([
        api("/api/admin/overview"),
        api("/api/admin/internships"),
        api("/api/admin/reports"),
      ]);
      setOverview(summary || {});
      setInternships(listing || []);
      setReports(moderation || []);
    } catch (requestError) {
      setError(requestError.message || "Could not load administrator data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function openNewForm() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
    setError("");
  }

  function openEditForm(item) {
    setEditingId(item.internshipId);
    setDraft({
      title: item.title || "",
      companyName: item.companyName || "",
      description: item.description || "",
      location: item.location || "",
      workMode: item.workMode || "REMOTE",
      durationWeeks: item.durationWeeks ?? "",
      stipendAmount: item.stipendAmount ?? "",
      applicationDeadline: item.applicationDeadline || "",
      status: item.status || "OPEN",
      requiredSkillIds: item.requiredSkillIds || [],
    });
    setFormOpen(true);
    setError("");
  }

  function changeDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function toggleSkill(skillId) {
    setDraft((current) => ({
      ...current,
      requiredSkillIds: current.requiredSkillIds.includes(skillId)
        ? current.requiredSkillIds.filter((id) => id !== skillId)
        : [...current.requiredSkillIds, skillId],
    }));
  }

  async function saveInternship(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      ...draft,
      durationWeeks: draft.durationWeeks === "" ? null : Number(draft.durationWeeks),
      stipendAmount: draft.stipendAmount === "" ? null : Number(draft.stipendAmount),
      applicationDeadline: draft.applicationDeadline || null,
      requiredSkillIds: draft.requiredSkillIds.map(Number),
    };
    try {
      await api(editingId ? `/api/admin/internships/${editingId}` : "/api/admin/internships", {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setFormOpen(false);
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      setNotice(editingId ? "Internship listing updated." : "Internship listing published.");
      await refresh(false);
    } catch (requestError) {
      setError(requestError.message || "Could not save this internship.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(item) {
    const status = item.status === "OPEN" ? "CLOSED" : "OPEN";
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/internships/${item.internshipId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(status === "OPEN" ? "Internship reopened." : "Internship closed.");
      await refresh(false);
    } catch (requestError) {
      setError(requestError.message || "Could not update the internship.");
    } finally {
      setBusy(false);
    }
  }

  async function dismissReport(reportId) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/reports/${reportId}`, { method: "DELETE" });
      setReports((current) => current.filter((item) => item.reportId !== reportId));
      setOverview((current) => ({ ...current, pendingReports: Math.max(0, Number(current.pendingReports || 0) - 1) }));
      setNotice("Report dismissed.");
    } catch (requestError) {
      setError(requestError.message || "Could not dismiss this report.");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(report) {
    if (!window.confirm(`Remove “${report.postTitle}” from the student community?`)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/community/posts/${report.postId}`, { method: "DELETE" });
      setReports((current) => current.filter((item) => item.postId !== report.postId));
      setOverview((current) => ({
        ...current,
        pendingReports: Math.max(0, Number(current.pendingReports || 0) - reports.filter((item) => item.postId === report.postId).length),
        visiblePosts: Math.max(0, Number(current.visiblePosts || 0) - 1),
      }));
      setNotice("Reported post removed from the community.");
    } catch (requestError) {
      setError(requestError.message || "Could not remove this post.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span className="admin-eyebrow">INTERNMATCH CONTROL ROOM</span>
          <h2>Admin workspace</h2>
          <p>Keep opportunities fresh and the student community safe, helpful and welcoming.</p>
        </div>
        <div className="admin-live"><span/> LIVE ADMIN ACCESS</div>
      </div>

      {notice && <div className="admin-notice">{notice}<button type="button" onClick={() => setNotice("")}>Dismiss</button></div>}
      {error && <div className="admin-error" role="alert">{error}<button type="button" onClick={() => setError("")}>Dismiss</button></div>}

      <div className="admin-workspace">
        <aside className="admin-menu">
          <div className="admin-menu-label">WORKSPACE</div>
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>◫</span> Overview</button>
          <button className={view === "internships" ? "active" : ""} onClick={() => { setView("internships"); setFormOpen(false); }}><span>▣</span> Internship listings <b>{internships.length}</b></button>
          <button className={view === "reports" ? "active" : ""} onClick={() => { setView("reports"); setFormOpen(false); }}><span>⚑</span> Community reports <b>{reports.length}</b></button>
          <div className="admin-menu-hint">Admin actions are protected by a server-side email allowlist.</div>
        </aside>

        <div className="admin-content">
          {view === "overview" && (
            <>
              <div className="admin-section-head"><div><span className="admin-kicker">AT A GLANCE</span><h3>Platform overview</h3></div><button className="admin-refresh" onClick={() => refresh()}>↻ Refresh</button></div>
              {loading ? <div className="admin-loading">Loading platform activity…</div> : (
                <>
                  <div className="admin-stats">
                    <article><span>Registered students</span><strong>{overview.students ?? 0}</strong><small>Student accounts</small></article>
                    <article><span>Open opportunities</span><strong>{overview.openInternships ?? 0}</strong><small>Currently accepting applications</small></article>
                    <article><span>Community discussions</span><strong>{overview.visiblePosts ?? 0}</strong><small>Visible to students</small></article>
                    <article className={Number(overview.pendingReports || 0) ? "attention" : ""}><span>Pending reports</span><strong>{overview.pendingReports ?? 0}</strong><small>Waiting for moderation</small></article>
                  </div>
                  <div className="admin-overview-grid">
                    <article className="admin-overview-card">
                      <span className="admin-kicker">OPPORTUNITIES</span><h4>Keep the listings useful</h4>
                      <p>Publish a new internship, update its requirements or close a listing that is no longer accepting applications.</p>
                      <button className="button button-dark" onClick={() => { setView("internships"); openNewForm(); }}>＋ Add an internship</button>
                    </article>
                    <article className="admin-overview-card">
                      <span className="admin-kicker">COMMUNITY HEALTH</span><h4>{reports.length ? "Reports need attention" : "Community is looking clear"}</h4>
                      <p>Review reports with their context. Remove a post only when it violates community standards; otherwise dismiss the report.</p>
                      <button className="button button-outline" onClick={() => setView("reports")}>Review reports <span>→</span></button>
                    </article>
                  </div>
                </>
              )}
            </>
          )}

          {view === "internships" && (
            <>
              <div className="admin-section-head"><div><span className="admin-kicker">OPPORTUNITY MANAGEMENT</span><h3>Internship listings</h3><p>Publish, maintain and close internship opportunities.</p></div><button className="button button-dark" onClick={openNewForm}>＋ New listing</button></div>
              {formOpen && (
                <form className="admin-internship-form" onSubmit={saveInternship}>
                  <div className="admin-form-head"><div><span className="admin-kicker">{editingId ? "EDIT LISTING" : "CREATE LISTING"}</span><h4>{editingId ? "Update internship" : "Publish an opportunity"}</h4></div><button type="button" className="admin-form-close" onClick={() => setFormOpen(false)}>×</button></div>
                  <div className="admin-form-grid">
                    <label>Internship title<input required maxLength="180" value={draft.title} onChange={(e) => changeDraft("title", e.target.value)} placeholder="e.g. Backend Developer Intern"/></label>
                    <label>Company name<input required maxLength="180" value={draft.companyName} onChange={(e) => changeDraft("companyName", e.target.value)} placeholder="Company"/></label>
                    <label>Location<input maxLength="180" value={draft.location} onChange={(e) => changeDraft("location", e.target.value)} placeholder="Remote / city"/></label>
                    <label>Work mode<select value={draft.workMode} onChange={(e) => changeDraft("workMode", e.target.value)}><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label>
                    <label>Duration (weeks)<input type="number" min="1" max="104" value={draft.durationWeeks} onChange={(e) => changeDraft("durationWeeks", e.target.value)} placeholder="12"/></label>
                    <label>Monthly stipend (INR)<input type="number" min="0" step="100" value={draft.stipendAmount} onChange={(e) => changeDraft("stipendAmount", e.target.value)} placeholder="15000"/></label>
                    <label>Application deadline<input type="date" value={draft.applicationDeadline} onChange={(e) => changeDraft("applicationDeadline", e.target.value)}/></label>
                    <label>Listing status<select value={draft.status} onChange={(e) => changeDraft("status", e.target.value)}><option value="OPEN">Open</option><option value="CLOSED">Closed</option></select></label>
                    <label className="admin-form-description">Description<textarea required rows="4" maxLength="10000" value={draft.description} onChange={(e) => changeDraft("description", e.target.value)} placeholder="Describe the role, responsibilities and what the intern will learn."/></label>
                  </div>
                  <div className="admin-skills-field"><div><b>Required skills</b><span>Select the skills used by the matching engine.</span></div><div className="admin-skill-picker">
                    {skills.map((skill) => <label key={skill.skillId}><input type="checkbox" checked={draft.requiredSkillIds.includes(skill.skillId)} onChange={() => toggleSkill(skill.skillId)}/>{skill.skillName}</label>)}
                    {!skills.length && <span>No skills are available in the skill catalogue.</span>}
                  </div></div>
                  <div className="admin-form-actions"><button type="button" className="button button-outline" onClick={() => setFormOpen(false)}>Cancel</button><button type="submit" className="button button-dark" disabled={busy}>{busy ? "Saving…" : editingId ? "Save changes" : "Publish listing"}</button></div>
                </form>
              )}
              {loading ? <div className="admin-loading">Loading internship listings…</div> : internships.length ? (
                <div className="admin-listings">
                  {internships.map((item) => <article className="admin-listing" key={item.internshipId}>
                    <div className="admin-listing-mark">{(item.companyName || "IN").slice(0, 2).toUpperCase()}</div>
                    <div className="admin-listing-copy"><div className="admin-listing-title"><h4>{item.title}</h4><span className={item.status === "OPEN" ? "admin-status open" : "admin-status closed"}>{item.status}</span></div><p>{item.companyName} · {item.location || "Location not specified"} · {item.workMode}</p><div className="admin-listing-meta"><span>{money(item.stipendAmount)}</span><span>{item.durationWeeks ? `${item.durationWeeks} weeks` : "Duration flexible"}</span><span>{item.requiredSkills?.length || 0} required skills</span></div></div>
                    <div className="admin-listing-actions"><button type="button" onClick={() => openEditForm(item)}>Edit</button><button type="button" onClick={() => toggleStatus(item)} disabled={busy}>{item.status === "OPEN" ? "Close" : "Reopen"}</button></div>
                  </article>)}
                </div>
              ) : <div className="admin-empty"><h4>No internship listings yet</h4><p>Publish the first opportunity for students.</p><button className="button button-dark" onClick={openNewForm}>＋ Add internship</button></div>}
            </>
          )}

          {view === "reports" && (
            <>
              <div className="admin-section-head"><div><span className="admin-kicker">TRUST & SAFETY</span><h3>Community reports</h3><p>Review reported discussions and take the appropriate action.</p></div><button className="admin-refresh" onClick={() => refresh()}>↻ Refresh</button></div>
              {loading ? <div className="admin-loading">Loading reports…</div> : reports.length ? (
                <div className="admin-reports">
                  {reports.map((report) => <article className="admin-report" key={report.reportId}>
                    <div className="admin-report-top"><span className="admin-report-reason">{String(report.reason || "OTHER").replaceAll("_", " ")}</span><span>{new Date(report.createdAt).toLocaleString("en-IN")}</span></div>
                    <h4>{report.postTitle}</h4><p className="admin-report-body">{report.postBody}</p>
                    <div className="admin-report-meta">Reported by <b>{report.reporterName}</b> · Post by <b>{report.authorName}</b></div>
                    {report.details && <blockquote className="admin-report-details">“{report.details}”</blockquote>}
                    <div className="admin-report-actions"><button type="button" className="admin-danger-action" onClick={() => removePost(report)} disabled={busy}>Remove post</button><button type="button" className="admin-dismiss-action" onClick={() => dismissReport(report.reportId)} disabled={busy}>Dismiss report</button></div>
                  </article>)}
                </div>
              ) : <div className="admin-empty"><h4>No reports to review</h4><p>New community reports will appear here for moderation.</p></div>}
            </>
          )}
        </div>
      </div>
      <p className="admin-footnote">Changes are saved directly to the live InternMatch database. Closing a listing keeps its existing applications and history intact.</p>
    </section>
  );
}

export default AdminDashboard;
