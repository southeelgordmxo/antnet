"use client";
import { useEffect, useState } from "react";
import type { Colony } from "./antnet";
import { ColonyHarvest } from "./colony-harvest";
type Ledger = {
  connected: boolean;
  wallet?: string;
  balance: number | null;
  transactions: {
    signature: string;
    blockTime: number | null;
    err: unknown;
    memo: string | null;
  }[];
};
export function TreasuryPanel({ colony }: { colony: Colony }) {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    let stop = false;
    async function get() {
      try {
        const r = await fetch("/api/treasury");
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        if (!stop) {
          setLedger(d);
          setError("");
        }
      } catch (e) {
        if (!stop) setError((e as Error).message);
      }
    }
    void get();
    const timer = setInterval(() => void get(), 60000);
    return () => {
      stop = true;
      clearInterval(timer);
    };
  }, []);
  return (
    <>
      <h1>
        the colony’s resources<span>.</span>
      </h1>
      <p className="subtitle">
        # transparent by design. follow the funding behind the foraging.
      </p>
      <div className="treasury-status">
        <span className="tag">
          {colony.config.contract ? "TOKEN CONFIGURED" : "PRE-LAUNCH"}
        </span>
        <h2>$ANT on pump.fun</h2>
        <p>
          Planned pairing: Anthropic. The verified contract and pair appear here
          once configured.
        </p>
        <div className="contract">
          <span>CA</span>
          <code>{colony.config.contract || "not deployed"}</code>
        </div>
        {colony.config.pairUrl && (
          <a
            className="primary"
            href={colony.config.pairUrl}
            target="_blank"
            rel="noreferrer"
          >
            view pair on pump.fun
          </a>
        )}
      </div>
      <ColonyHarvest />
      <div className="flow">
        <div>
          <small>01 / FUND</small>
          <h3>creator fees</h3>
          <p>fee routing not activated</p>
        </div>
        <span>·····</span>
        <div>
          <small>02 / SUSTAIN</small>
          <h3>
            {ledger?.balance != null
              ? `${ledger.balance.toFixed(4)} SOL`
              : "colony treasury"}
          </h3>
          <p>
            {ledger?.connected ? (
              <a
                href={`https://solscan.io/account/${ledger.wallet}`}
                target="_blank"
                rel="noreferrer"
              >
                view treasury wallet
              </a>
            ) : (
              "wallet pending"
            )}
          </p>
        </div>
        <span>·····</span>
        <div>
          <small>03 / RESEARCH</small>
          <h3>ants + Claude</h3>
          <p>crawl & inference costs</p>
        </div>
      </div>
      <div className="section-toolbar">
        <h2 className="section-title">on-chain ledger</h2>
        <select
          aria-label="Filter treasury transactions"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "auto" }}
        >
          <option value="all">all transactions</option>
          <option value="confirmed">confirmed</option>
          <option value="failed">failed</option>
        </select>
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {ledger?.connected ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TIME</th>
                <th>STATUS</th>
                <th>MEMO</th>
                <th>TRANSACTION</th>
              </tr>
            </thead>
            <tbody>
              {ledger.transactions
                .filter(
                  (t) => filter === "all" || (filter === "failed") === !!t.err,
                )
                .map((t) => (
                  <tr key={t.signature}>
                    <td>
                      {t.blockTime
                        ? new Date(t.blockTime * 1000).toLocaleString()
                        : "pending"}
                    </td>
                    <td>{t.err ? "failed" : "confirmed"}</td>
                    <td>{t.memo || "—"}</td>
                    <td>
                      <a
                        className="text-link"
                        href={`https://solscan.io/tx/${t.signature}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.signature.slice(0, 8)}…{t.signature.slice(-5)}
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-ledger">
          <span>—</span>
          <p>
            No treasury feed is connected. Add the treasury wallet to read its
            live balance and transaction history.
          </p>
        </div>
      )}
      <div className="notice">
        Reward epochs, fee splits, burns, and on-chain minting need AntNet’s
        deployed contracts and verified transaction handlers. No payout amounts
        are simulated.
      </div>
      <p className="small muted">
        AntNet is an independent project. Anthropic-inspired branding does not
        imply endorsement by Anthropic.
      </p>
    </>
  );
}
