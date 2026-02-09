'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-shadow">
              <span className="text-2xl font-bold text-black">DF</span>
            </div>
            <span className="font-orbitron font-bold text-lg text-white hidden sm:block">
              THE DIGITAL <span className="text-cyan-400">FORGE</span>
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink href="/" active={pathname === '/'}>
              Home
            </NavLink>
            <NavLink href="/forge" active={pathname === '/forge'}>
              Forge Token
            </NavLink>
            <NavLink href="/tokens" active={pathname === '/tokens' || pathname.startsWith('/tokens/')}>
              Token Gallery
            </NavLink>
            <NavLink href="/swap" active={pathname === '/swap'}>
              Swap
            </NavLink>
            <NavLink href="/farms" active={pathname === '/farms' || pathname.startsWith('/farms/')}>
              Farms
            </NavLink>
            <NavLink href="/docs" active={pathname === '/docs'}>
              Grimoire
            </NavLink>
          </nav>

          {/* Wallet Connect + Mobile Toggle */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`block w-6 h-0.5 bg-cyan-400 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-6 h-0.5 bg-cyan-400 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-6 h-0.5 bg-cyan-400 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </button>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      style: {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-lg font-rajdhani font-semibold text-black hover:shadow-glow-cyan transition-all"
                          >
                            Connect Wallet
                          </button>
                        );
                      }

                      if (chain.unsupported) {
                        return (
                          <button
                            onClick={openChainModal}
                            className="px-4 py-2 bg-red-500 rounded-lg font-rajdhani font-semibold text-white hover:bg-red-600 transition-all"
                          >
                            Wrong Network
                          </button>
                        );
                      }

                      return (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={openChainModal}
                            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:border-cyan-500/50 transition-all"
                          >
                            {chain.hasIcon && (
                              <div
                                style={{
                                  background: chain.iconBackground,
                                  width: 16,
                                  height: 16,
                                  borderRadius: 999,
                                  overflow: 'hidden',
                                }}
                              >
                                {chain.iconUrl && (
                                  <img
                                    alt={chain.name ?? 'Chain icon'}
                                    src={chain.iconUrl}
                                    style={{ width: 16, height: 16 }}
                                  />
                                )}
                              </div>
                            )}
                            <span className="font-rajdhani text-sm">{chain.name}</span>
                          </button>

                          <button
                            onClick={openAccountModal}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 border border-cyan-500/30 rounded-lg hover:border-cyan-500/50 transition-all"
                          >
                            <span className="font-rajdhani font-semibold text-white">
                              {account.displayName}
                            </span>
                            <span className="hidden sm:block text-cyan-400 text-sm font-rajdhani">
                              {account.displayBalance ? `(${account.displayBalance})` : ''}
                            </span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-cyan-500/20">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <MobileNavLink href="/" active={pathname === '/'} onClick={() => setMobileMenuOpen(false)}>
              Home
            </MobileNavLink>
            <MobileNavLink href="/forge" active={pathname === '/forge'} onClick={() => setMobileMenuOpen(false)}>
              Forge Token
            </MobileNavLink>
            <MobileNavLink href="/tokens" active={pathname === '/tokens' || pathname.startsWith('/tokens/')} onClick={() => setMobileMenuOpen(false)}>
              Token Gallery
            </MobileNavLink>
            <MobileNavLink href="/swap" active={pathname === '/swap'} onClick={() => setMobileMenuOpen(false)}>
              Swap
            </MobileNavLink>
            <MobileNavLink href="/farms" active={pathname === '/farms' || pathname.startsWith('/farms/')} onClick={() => setMobileMenuOpen(false)}>
              Farms
            </MobileNavLink>
            <MobileNavLink href="/docs" active={pathname === '/docs'} onClick={() => setMobileMenuOpen(false)}>
              Grimoire
            </MobileNavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function MobileNavLink({
  href,
  active,
  onClick,
  children,
}: {
  href: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`font-rajdhani font-semibold text-base py-2.5 px-3 rounded-lg transition-colors ${
        active
          ? 'text-cyan-400 bg-cyan-500/10'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`font-rajdhani font-semibold text-sm transition-colors ${
        active
          ? 'text-cyan-400'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
}
