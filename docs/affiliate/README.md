# Affiliate program reference (AWIN)

Welcome-pack snapshots for the approved AWIN parking programs, saved 2026-06-12 for reference.
All three are **Holiday Extras Group** brands (same parent, same account managers).

**Publisher ID (`awinaffid` / `id`): `2932035`** — for *all* programs.
> ⚠️ The Airparks welcome pack shows an example link with `id=449305` — that is **not ours**. Always use `2932035`.

## Cross-pack quick reference

| Brand | AWIN `mid` | Parking discount (baseline / max) | Commission | Auto-discount? | Terms |
|---|---|---|---|---|---|
| **Holiday Extras** | `3496` | **10%** / 25% (Gatwick Meet & Greet North only) | **2% CPA** | Yes — embedded in link | [terms/3496](https://ui.awin.com/merchant-profile-terms/3496) |
| **Purple Parking** | `12028` | **12%** / 23% (Exeter Flyparks only) | Ask James Thompson | Yes — embedded in link | [terms/12028](https://ui.awin.com/merchant-profile-terms/12028) |
| **Airparks** | `3494` | **10%** / 25% (Exeter Flyparks only) | Ask James Thompson | Yes — embedded in link | [terms/3494](https://ui.awin.com/merchant-profile-terms/3494) |

Also available to apply for: **BCP** (`mid 3495`), **Holiday Extras UK Breaks** (`mid 20881`).

## Join status & EPC (AWIN dashboard, 2026-06-12)

Only **Holiday Extras is JOINED/live**. The others received welcome packs but AWIN still shows them **Pending** — `partners.json` reflects this (HE active, rest inactive). Don't treat pending merchants as live.

| Merchant | Status | EPC (GBP) | Conv. |
|---|---|---|---|
| Holiday Extras | **Joined** | 0.17 | 7.64% |
| Heathrow Airport Parking | Pending | **1.48** | 11.42% |
| APH | Pending | 0.23 | 8.07% |
| Purple Parking | Pending | 0.09 | 6.81% |
| Airparks | Pending | 0.08 | 6.76% |

**Revenue note:** HE is the best *general* merchant by EPC. **Heathrow Airport Parking (£1.48 ≈ 9× HE)** is the obvious Heathrow per-airport override once approved; APH (£0.23) also beats HE. Purple Parking / Airparks have low EPC despite better headline user discounts — little case to feature them over HE.

## Rules that apply to all three

- **Auto-discount:** the discount code is embedded in the affiliate link — no code to paste. Tell users: *"Code automatically applies. Search on {brand} to see the discount."*
- **Discount accuracy (ASA):** the headline "up to 23–25%" is **one specific car park** (Gatwick for HE, Exeter for PP/Airparks). The honest sitewide figure is the **baseline** (10% HE/Airparks, 12% PP) with a terms link. Never splash the max % sitewide.
- **Images/logos:** usable **only to promote that specific brand**, and **they audit usage**. Do not use as generic decoration.
- **No PPC brand bidding** on the brands' terms (HE pack: 1-week commission clawback).
- **Best Price Guaranteed**, 28 UK airports, discount auto-applies — shared claims.
- Link format AWIN gives: `awclick.php?mid=<mid>&id=2932035`. Our app uses the `cread.php` superset with `clickref=parkmath-<airport>` for per-airport tracking — keep that.

See `holiday-extras-welcome-pack.md` for the fullest pack (it has the USP/keywords/exposure detail; the keywords doc is shared across all three). Related memory: `holiday-extras-affiliate-assets`.
