"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Save, Building, FileText, Percent, Palette, Layout, Bell } from "lucide-react";
import { uiPrimaryButtonClass } from "@/components/ui/classes";

const tabs = [
  { id: "profile", label: "Profile", icon: Building },
  { id: "business", label: "Business", icon: Building },
  { id: "defaults", label: "Invoice Defaults", icon: FileText },
  { id: "tax", label: "Tax Settings", icon: Percent },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "templates", label: "Templates", icon: Layout },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const { userId } = useAuth();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("business");
  const [notice, setNotice] = useState<string | null>(null);
  
  const user = useQuery(
    api.users.getUserByClerkId,
    userId ? { clerkUserId: userId } : "skip",
  );
  const updateUser = useMutation(api.users.updateUser);

  const [formData, setFormData] = useState({
    companyName: user?.companyName || "",
    companyAddress: user?.companyAddress || "",
    phone: user?.phone || "",
    website: user?.website || "",
    invoicePrefix: user?.invoicePrefix || "INV",
    defaultCurrency: user?.defaultCurrency || "USD",
    defaultPaymentTermsDays: user?.defaultPaymentTermsDays || 30,
    paymentInstructions: user?.paymentInstructions || "",
    brandColor: user?.brandColor || "#3B82F6",
    salesTaxEnabled: user?.salesTaxEnabled || false,
    salesTaxRate: user?.salesTaxRate || 0,
    vatEnabled: user?.vatEnabled || false,
    vatRate: user?.vatRate || 0,
    notifyInvoiceViewed: user?.notifyInvoiceViewed || false,
    notifyInvoiceOverdue: user?.notifyInvoiceOverdue ?? true,
    notifyInvoiceDueSoon: user?.notifyInvoiceDueSoon ?? true,
    notifyInvoicePaid: user?.notifyInvoicePaid ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      companyName: user.companyName || "",
      companyAddress: user.companyAddress || "",
      phone: user.phone || "",
      website: user.website || "",
      invoicePrefix: user.invoicePrefix || "INV",
      defaultCurrency: user.defaultCurrency || "USD",
      defaultPaymentTermsDays: user.defaultPaymentTermsDays || 30,
      paymentInstructions: user.paymentInstructions || "",
      brandColor: user.brandColor || "#3B82F6",
      salesTaxEnabled: user.salesTaxEnabled || false,
      salesTaxRate: user.salesTaxRate || 0,
      vatEnabled: user.vatEnabled || false,
      vatRate: user.vatRate || 0,
      notifyInvoiceViewed: user.notifyInvoiceViewed || false,
      notifyInvoiceOverdue: user.notifyInvoiceOverdue ?? true,
      notifyInvoiceDueSoon: user.notifyInvoiceDueSoon ?? true,
      notifyInvoicePaid: user.notifyInvoicePaid ?? true,
    });
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && tabs.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!user?._id) return;
    setNotice(null);
    setIsSaving(true);
    try {
      await updateUser({
        userId: user._id,
        updates: formData,
      });
      setNotice("Settings saved.");
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const currencies = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"];
  const paymentTerms = [7, 14, 30, 60];

  return (
    <div className="space-y-6">
      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={uiPrimaryButtonClass}
        >
          <Save className="w-5 h-5" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-48 bg-white rounded-xl border border-gray-200 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === "business" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                <textarea
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "defaults" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Defaults</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
                  <select
                    value={formData.defaultCurrency}
                    onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Terms</label>
                <select
                  value={formData.defaultPaymentTermsDays}
                  onChange={(e) => setFormData({ ...formData, defaultPaymentTermsDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {paymentTerms.map((days) => (
                    <option key={days} value={days}>Net {days}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Instructions</label>
                <textarea
                  value={formData.paymentInstructions}
                  onChange={(e) => setFormData({ ...formData, paymentInstructions: e.target.value })}
                  rows={3}
                  placeholder="Bank details, PayPal link, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {activeTab === "tax" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Tax Settings</h3>
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id="salesTaxEnabled"
                    checked={formData.salesTaxEnabled}
                    onChange={(e) => setFormData({ ...formData, salesTaxEnabled: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="salesTaxEnabled" className="text-sm font-medium text-gray-700">
                    Enable Sales Tax
                  </label>
                  {formData.salesTaxEnabled && (
                    <input
                      type="number"
                      value={formData.salesTaxRate}
                      onChange={(e) => setFormData({ ...formData, salesTaxRate: Number(e.target.value) })}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Rate %"
                    />
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    id="vatEnabled"
                    checked={formData.vatEnabled}
                    onChange={(e) => setFormData({ ...formData, vatEnabled: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="vatEnabled" className="text-sm font-medium text-gray-700">
                    Enable VAT
                  </label>
                  {formData.vatEnabled && (
                    <input
                      type="number"
                      value={formData.vatRate}
                      onChange={(e) => setFormData({ ...formData, vatRate: Number(e.target.value) })}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Rate %"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "branding" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Branding</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.brandColor}
                    onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  This color will be used in your PDF invoices and email templates.
                </p>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              <p className="text-gray-500">
                Your profile information is managed by Clerk. Visit your Clerk account settings to update your name and email.
              </p>
            </div>
          )}

          {activeTab === "templates" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Templates</h3>
              <p className="text-gray-500">
                Template management is not wired into this build yet, so the unfinished action has
                been removed instead of leaving a broken button in settings.
              </p>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm text-[var(--muted)]">
                When templates are added, they should also connect directly to the invoice composer.
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
              <div className="space-y-3">
                {[
                  {
                    field: "notifyInvoiceViewed",
                    label: "Invoice viewed by client",
                  },
                  {
                    field: "notifyInvoiceOverdue",
                    label: "Invoice becomes overdue",
                  },
                  {
                    field: "notifyInvoiceDueSoon",
                    label: "Reminder: invoices due in 3 days",
                  },
                  {
                    field: "notifyInvoicePaid",
                    label: "Invoice fully paid",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={item.label}
                      checked={formData[item.field as keyof typeof formData] as boolean}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          [item.field]: event.target.checked,
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={item.label} className="text-sm text-gray-700">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                These preferences are now saved with the rest of your settings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
