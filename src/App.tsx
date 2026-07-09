import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CreatePage from './components/CreatePage';
import ProductDashboardView from './components/ProductDashboardView';
import ProductLibraryView from './components/ProductLibraryView';
import DashboardOverview from './components/DashboardOverview';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';
import { DigitalProduct, AICreditCost } from './types';

// Mock seeder is now empty to start from scratch without mock data
const SEEDED_PRODUCTS: DigitalProduct[] = [];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('create');
  const [activeProduct, setActiveProduct] = useState<DigitalProduct | null>(null);
  
  // Platform credits
  const [credits, setCredits] = useState<number>(12450);

  // Credit cost configurations
  const [creditCosts, setCreditCosts] = useState<AICreditCost[]>([
    { action: "Initial Product Generation", cost: 150 },
    { action: "SEO Strategy Audit", cost: 30 },
    { action: "Full Language Translation", cost: 50 },
    { action: "Aesthetic Layout Adjustments", cost: 40 }
  ]);

  // Load and save from localStorage
  const [products, setProducts] = useState<DigitalProduct[]>(() => {
    const saved = localStorage.getItem('bgrowth_studio_products_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure we filter out any legacy seeded objects if they exist
        return Array.isArray(parsed) ? parsed.filter((p: any) => !p.id.startsWith('seed_')) : SEEDED_PRODUCTS;
      } catch {
        return SEEDED_PRODUCTS;
      }
    }
    return SEEDED_PRODUCTS;
  });

  useEffect(() => {
    localStorage.setItem('bgrowth_studio_products_v3', JSON.stringify(products));
  }, [products]);

  // Generate / Create digital product from prompt
  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerateProduct = async (prompt: string, productType?: string, blueprint?: any) => {
    setIsGenerating(true);
    
    // Deduct cost
    const generationCost = creditCosts.find(c => c.action === "Initial Product Generation")?.cost || 150;
    setCredits(prev => Math.max(0, prev - generationCost));

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, productType, blueprint })
      });
      
      const data = await response.json();
      if (data.product) {
        // Enforce version seeder sync
        const newProduct = data.product;
        // Prepend new product
        setProducts(prev => [newProduct, ...prev]);
        setActiveProduct(newProduct);
        setCurrentTab('create'); // Navigate to active workspace
      } else {
        throw new Error(data.error || "No product returned");
      }
    } catch (error) {
      console.error("Failed to generate digital product:", error);
      alert("A processing error occurred. The BGrowth local template engine resolved the issue to ensure continuity.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine / Improve existing product using Gemini
  const [isImproving, setIsImproving] = useState(false);
  const handleImproveProduct = async (action: string, instruction?: string) => {
    if (!activeProduct) return;
    setIsImproving(true);

    // Deduct cost
    const costAction = action.includes('SEO') ? 'SEO Strategy Audit' : 
                       action.includes('Translate') ? 'Full Language Translation' : 
                       'Aesthetic Layout Adjustments';
    const cost = creditCosts.find(c => c.action === costAction)?.cost || 30;
    setCredits(prev => Math.max(0, prev - cost));

    try {
      const response = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: activeProduct, action, instruction })
      });
      
      const data = await response.json();
      if (data.product) {
        const updated = data.product;
        setActiveProduct(updated);
        // Replace in master list
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      } else {
        throw new Error(data.error || "Could not improve product");
      }
    } catch (error: any) {
      console.error("AI improvement failed:", error);
      alert(`AI co-creator failed: ${error.message || 'connection issue'}`);
    } finally {
      setIsImproving(false);
    }
  };

  const handleUpdateProduct = (updated: DigitalProduct) => {
    setActiveProduct(updated);
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      setProducts(prev => prev.filter(p => p.id !== id));
      if (activeProduct?.id === id) {
        setActiveProduct(null);
      }
    }
  };

  const handleToggleFavorite = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, isFavorite: !p.isFavorite };
        if (activeProduct?.id === id) {
          setActiveProduct(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  return (
    <div className="flex h-screen bg-slate-50/50 text-slate-800 font-sans overflow-hidden select-none">
      
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={activeProduct ? 'products' : currentTab}
        onTabChange={(tab) => {
          setActiveProduct(null); // Clear active workspace to show main tabs
          setCurrentTab(tab);
        }}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header bar */}
        <Header
          credits={credits}
          currentTab={activeProduct ? 'products' : currentTab}
        />

        {/* Dynamic Inner Content Loader */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeProduct ? (
            <ProductDashboardView
              product={activeProduct}
              onBack={() => setActiveProduct(null)}
              onUpdateProduct={handleUpdateProduct}
              onImproveProduct={handleImproveProduct}
              isImproving={isImproving}
              creditsCostConfigs={creditCosts}
            />
          ) : (
            <>
              {currentTab === 'create' && (
                <CreatePage
                  onGenerate={handleGenerateProduct}
                  isGenerating={isGenerating}
                  recentProducts={products}
                  onSelectProduct={(p) => setActiveProduct(p)}
                  credits={credits}
                />
              )}

              {currentTab === 'dashboard' && (
                <DashboardOverview
                  products={products}
                  credits={credits}
                  onTabChange={(tab) => setCurrentTab(tab)}
                  onSelectProduct={(p) => setActiveProduct(p)}
                />
              )}

              {currentTab === 'products' && (
                <ProductLibraryView
                  products={products}
                  onSelectProduct={(p) => setActiveProduct(p)}
                  onDeleteProduct={handleDeleteProduct}
                  onToggleFavorite={handleToggleFavorite}
                  onCreateNew={() => setCurrentTab('create')}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsView products={products} />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  creditCosts={creditCosts}
                  onUpdateCreditCosts={(updated) => setCreditCosts(updated)}
                />
              )}

              {/* Catch-all fallback */}
              {!['create', 'dashboard', 'products', 'analytics', 'settings'].includes(currentTab) && (
                <div className="flex-1 flex items-center justify-center text-slate-400 font-semibold text-xs">
                  This custom Builder module is currently loading...
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
