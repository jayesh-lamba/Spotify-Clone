import "./Settings.css";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePlayer } from "../context/PlayerContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Settings() {
    const { user, updateUserSettings, updateUserProfile, logout } = useAuth();
    const { sleepTimer, setSleepTimer, sleepRemainingSeconds } = usePlayer();
    const navigate = useNavigate();

    const settings = user?.settings || {
        audioQuality: "Automatic",
        autoplay: true,
        crossfade: false,
        theme: "Dark",
        animations: true,
        newReleasesNotif: true,
        recommendationsNotif: true,
        privateSession: false,
        personalizedRecs: true,
    };

    const [message, setMessage] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Modal state for editing Profile (Username/Email), Changing Password, Deleting Account
    const [activeModal, setActiveModal] = useState(null); // 'profile' | 'password' | 'deleteAccount'

    // Form inputs
    const [editUsername, setEditUsername] = useState(user?.username || "");
    const [editEmail, setEditEmail] = useState(user?.email || "");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [deletePassword, setDeletePassword] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    const showSuccess = (text) => {
        setMessage(text);
        setErrorMsg("");
        setTimeout(() => setMessage(""), 4000);
    };

    const showError = (text) => {
        setErrorMsg(text);
        setMessage("");
    };

    const handleSettingChange = async (key, value) => {
        setMessage("");
        setErrorMsg("");

        if (key === "theme") {
            localStorage.setItem("orivio_theme", value);
            window.dispatchEvent(new CustomEvent("orivio:theme-change", { detail: { theme: value } }));
        }

        try {
            await updateUserSettings({ [key]: value });
            showSuccess(`Setting updated: ${key}`);
        } catch (err) {
            showError(err.message || "Failed to update settings.");
        }
    };

    // Open Profile Edit modal
    const openProfileModal = () => {
        setEditUsername(user?.username || "");
        setEditEmail(user?.email || "");
        setErrorMsg("");
        setActiveModal("profile");
    };

    // Save Profile Edit (Username & Email)
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!editUsername.trim() || editUsername.trim().length < 2) {
            showError("Username must be at least 2 characters.");
            return;
        }

        setActionLoading(true);
        setErrorMsg("");

        try {
            await updateUserProfile({
                username: editUsername.trim(),
                email: editEmail.trim(),
            });
            setActiveModal(null);
            showSuccess("Profile updated successfully!");
        } catch (err) {
            showError(err.message || "Failed to update profile.");
        } finally {
            setActionLoading(false);
        }
    };

    // Open Password Change modal
    const openPasswordModal = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setErrorMsg("");
        setActiveModal("password");
    };

    // Save Password Change
    const handleSavePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword) {
            showError("Current password is required.");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            showError("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            showError("New passwords do not match.");
            return;
        }
        if (currentPassword === newPassword) {
            showError("New password must be different from current password.");
            return;
        }

        setActionLoading(true);
        setErrorMsg("");

        try {
            const res = await api.changePassword({ currentPassword, newPassword });
            if (res?.success) {
                setActiveModal(null);
                showSuccess("Password changed successfully!");
            } else {
                showError(res?.message || "Failed to change password.");
            }
        } catch (err) {
            showError(err.message || "Failed to change password.");
        } finally {
            setActionLoading(false);
        }
    };

    // Open Delete Account modal
    const openDeleteModal = () => {
        setDeletePassword("");
        setErrorMsg("");
        setActiveModal("deleteAccount");
    };

    // Confirm Account Deletion
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        if (!deletePassword) {
            showError("Password confirmation is required to delete account.");
            return;
        }

        setActionLoading(true);
        setErrorMsg("");

        try {
            const res = await api.deleteAccount(deletePassword);
            if (res?.success) {
                setActiveModal(null);
                await logout();
                navigate("/signup");
            } else {
                showError(res?.message || "Failed to delete account.");
            }
        } catch (err) {
            showError(err.message || "Failed to delete account.");
        } finally {
            setActionLoading(false);
        }
    };

    // Clear Search History
    const handleClearSearch = async () => {
        if (!window.confirm("Are you sure you want to clear your search history?")) return;
        try {
            await api.clearSearchHistory();
            showSuccess("Search history cleared successfully.");
        } catch (err) {
            showError(err.message || "Failed to clear search history.");
        }
    };

    // Clear Recently Played
    const handleClearRecent = async () => {
        if (!window.confirm("Are you sure you want to clear your listening history?")) return;
        try {
            await api.clearRecentlyPlayed();
            showSuccess("Recently played history cleared successfully.");
        } catch (err) {
            showError(err.message || "Failed to clear listening history.");
        }
    };

    // Logout
    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <main className="Settings-page">

            {/* =================================
                HEADER
            ================================= */}
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Customize your Orivio experience.</p>

                {message && (
                    <div className="settings-banner settings-banner--success">
                        <i className="fa-solid fa-circle-check"></i>
                        <span>{message}</span>
                    </div>
                )}

                {errorMsg && !activeModal && (
                    <div className="settings-banner settings-banner--error">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{errorMsg}</span>
                    </div>
                )}
            </div>


            {/* =================================
                ACCOUNT
            ================================= */}
            <section className="settings-section">
                <h2>Account</h2>
                <div className="settings-card">

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Profile ({user?.username || "Guest"})</h3>
                            <p>Manage your display name and public profile.</p>
                        </div>
                        <button className="settings-action" onClick={openProfileModal}>
                            Edit Profile
                        </button>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Email Address</h3>
                            <p>{user?.email || "No email associated."}</p>
                        </div>
                        <button className="settings-action" onClick={openProfileModal}>
                            Change Email
                        </button>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Password</h3>
                            <p>Change your account password for security.</p>
                        </div>
                        <button className="settings-action" onClick={openPasswordModal}>
                            Change Password
                        </button>
                    </div>

                </div>
            </section>


            {/* =================================
                PLAYBACK
            ================================= */}
            <section className="settings-section">
                <h2>Playback</h2>
                <div className="settings-card">

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Audio Quality</h3>
                            <p>Choose the stream audio quality level.</p>
                        </div>
                        <select
                            className="settings-select"
                            value={settings.audioQuality || "Automatic"}
                            onChange={(e) => handleSettingChange("audioQuality", e.target.value)}
                        >
                            <option value="Automatic">Automatic</option>
                            <option value="Low">Low</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Autoplay</h3>
                            <p>Automatically play similar music when your playlist/queue ends.</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={!!settings.autoplay}
                                onChange={(e) => handleSettingChange("autoplay", e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Crossfade</h3>
                            <p>Smoothly transition between songs with volume fade.</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={!!settings.crossfade}
                                onChange={(e) => handleSettingChange("crossfade", e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Sleep Timer</h3>
                            <p>
                                Automatically pause playback after chosen duration.
                                {sleepRemainingSeconds > 0 && (
                                    <span style={{ color: "var(--accent-orange)", marginLeft: "8px", fontWeight: "600" }}>
                                        ({Math.floor(sleepRemainingSeconds / 60)}m {sleepRemainingSeconds % 60}s remaining)
                                    </span>
                                )}
                            </p>
                        </div>
                        <select
                            className="settings-select"
                            value={sleepTimer || "off"}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "off") setSleepTimer("off");
                                else if (val === "end_of_song") setSleepTimer("end_of_song");
                                else setSleepTimer(parseInt(val, 10));
                            }}
                        >
                            <option value="off">Off</option>
                            <option value="5">5 Minutes</option>
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="45">45 Minutes</option>
                            <option value="60">60 Minutes</option>
                            <option value="end_of_song">End of Song</option>
                        </select>
                    </div>

                </div>
            </section>


            {/* =================================
                APPEARANCE
            ================================= */}
            <section className="settings-section">
                <h2>Appearance</h2>
                <div className="settings-card">

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Theme</h3>
                            <p>Choose how Orivio looks across all screens.</p>
                        </div>
                        <select
                            className="settings-select"
                            value={settings.theme || "Dark"}
                            onChange={(e) => handleSettingChange("theme", e.target.value)}
                        >
                            <option value="Dark">Dark</option>
                            <option value="Light">Light</option>
                            <option value="System Default">System Default</option>
                        </select>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Animations</h3>
                            <p>Enable smooth UI motion and transition effects.</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.animations !== false}
                                onChange={(e) => handleSettingChange("animations", e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                </div>
            </section>


            {/* =================================
                NOTIFICATIONS
            ================================= */}
            <section className="settings-section">
                <h2>Notifications</h2>
                <div className="settings-card">

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>New Releases</h3>
                            <p>Get notified about new song & album releases.</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.newReleasesNotif !== false}
                                onChange={(e) => handleSettingChange("newReleasesNotif", e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Music Recommendations</h3>
                            <p>Receive personalized music suggestions.</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.recommendationsNotif !== false}
                                onChange={(e) => handleSettingChange("recommendationsNotif", e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                </div>
            </section>


            {/* =================================
                PRIVACY & DATA
            ================================= */}
            <section className="settings-section">
                <h2>Privacy & Data</h2>
                <div className="settings-card">

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Private Session</h3>
                            <p>Hide your current listening activity from history & friends.</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={!!settings.privateSession}
                                onChange={(e) => handleSettingChange("privateSession", e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Personalized Recommendations</h3>
                            <p>Allow Orivio to use your playback history for recommendations.</p>
                        </div>
                        <label className="toggle">
                            <input
                                type="checkbox"
                                checked={settings.personalizedRecs !== false}
                                onChange={(e) => handleSettingChange("personalizedRecs", e.target.checked)}
                            />
                            <span></span>
                        </label>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Clear Search History</h3>
                            <p>Remove all saved recent search queries.</p>
                        </div>
                        <button className="settings-action" onClick={handleClearSearch}>
                            Clear History
                        </button>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Clear Listening History</h3>
                            <p>Clear all songs from your Recently Played list.</p>
                        </div>
                        <button className="settings-action" onClick={handleClearRecent}>
                            Clear Played
                        </button>
                    </div>

                </div>
            </section>


            {/* =================================
                ACCOUNT ACTIONS (DANGER ZONE)
            ================================= */}
            <section className="settings-section">
                <h2>Account Actions</h2>
                <div className="settings-card">

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3>Sign Out</h3>
                            <p>Log out of your current ORIVIO session.</p>
                        </div>
                        <button className="settings-action" onClick={handleLogout}>
                            Log Out
                        </button>
                    </div>

                    <div className="setting-item">
                        <div className="setting-info">
                            <h3 style={{ color: "#ff6b6b" }}>Delete Account</h3>
                            <p>Permanently delete your account and profile settings.</p>
                        </div>
                        <button
                            className="settings-action"
                            onClick={openDeleteModal}
                            style={{ borderColor: "#ff6b6b", color: "#ff6b6b" }}
                        >
                            Delete Account
                        </button>
                    </div>

                </div>
            </section>


            {/* =================================
                MODALS FOR EDITING
            ================================= */}

            {/* Profile Edit Modal */}
            {activeModal === "profile" && (
                <div className="settings-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h2>Edit Profile</h2>
                            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
                        </div>

                        {errorMsg && (
                            <div className="settings-banner settings-banner--error">
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSaveProfile} className="settings-modal-form">
                            <label>Username</label>
                            <input
                                type="text"
                                value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value)}
                                placeholder="Username"
                                required
                            />

                            <label>Email Address</label>
                            <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                            />

                            <div className="settings-modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={actionLoading}>
                                    {actionLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {activeModal === "password" && (
                <div className="settings-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h2>Change Password</h2>
                            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
                        </div>

                        {errorMsg && (
                            <div className="settings-banner settings-banner--error">
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleSavePassword} className="settings-modal-form">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Current password"
                                required
                            />

                            <label>New Password (min 6 characters)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="New password"
                                required
                            />

                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />

                            <div className="settings-modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={actionLoading}>
                                    {actionLoading ? "Updating..." : "Update Password"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Account Confirmation Modal */}
            {activeModal === "deleteAccount" && (
                <div className="settings-modal-overlay" onClick={() => setActiveModal(null)}>
                    <div className="settings-modal settings-modal--danger" onClick={(e) => e.stopPropagation()}>
                        <div className="settings-modal-header">
                            <h2 style={{ color: "#ff6b6b" }}>Delete Account</h2>
                            <button className="modal-close-btn" onClick={() => setActiveModal(null)}>✕</button>
                        </div>

                        <p className="danger-notice">
                            Warning: This action is permanent. All your profile data, playlists, and settings will be permanently removed.
                        </p>

                        {errorMsg && (
                            <div className="settings-banner settings-banner--error">
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form onSubmit={handleDeleteAccount} className="settings-modal-form">
                            <label>Enter Password to Confirm</label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Your password"
                                required
                            />

                            <div className="settings-modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setActiveModal(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-delete" disabled={actionLoading}>
                                    {actionLoading ? "Deleting..." : "Permanently Delete"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </main>
    );
}

export default Settings;