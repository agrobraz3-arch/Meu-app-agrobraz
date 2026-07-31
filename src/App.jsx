import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy,
  setDoc
} from 'firebase/firestore';
import { 
  Droplet, 
  PlusCircle, 
  MinusCircle, 
  Package, 
  TrendingUp, 
  FileText, 
  History,
  AlertCircle,
  Plus
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyDUQaX...",
  authDomain: "app-herbicida-e-gerais.firebaseapp.com",
  projectId: "app-herbicida-e-gerais",
  storageBucket: "app-herbicida-e-gerais.appspot.com",
  messagingSenderId: "708858351613",
  appId: "1:708858351613:web:...",
  measurementId: "G-YW..."
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SEED_PRODUCTS = [
  { id: "p1", nome: "24D", valorUnitario: 40, minimo: 3, unidade: "L", qtdEstoque: 0 },
  { id: "p2", nome: "HEXAZINONA D", valorUnitario: 310, minimo: 3, unidade: "Kg", qtdEstoque: 0 },
  { id: "p3", nome: "ROUNDUP", valorUnitario: 40, minimo: 3, unidade: "gl", qtdEstoque: 0 },
  { id: "p4", nome: "CALIST", valorUnitario: 115, minimo: 3, unidade: "L", qtdEstoque: 0 }
];

const fmtBRL = (n) => (n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function App() {
  const [activeTab, setActiveTab] = useState('estoque');
  const [produtos, setProdutos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulário Movimentação
  const [prodSel, setProdSel] = useState('');
  const [tipoMov, setTipoMov] = useState('SAIDA');
  const [qtdMov, setQtdMov] = useState('');
  const [obsMov, setObsMov] = useState('');

  // Formulário Novo Produto
  const [novoNome, setNovoNome] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novoMinimo, setNovoMinimo] = useState(3);
  const [novaUnidade, setNovaUnidade] = useState('L');

  useEffect(() => {
    const unsubProd = onSnapshot(collection(db, 'produtos'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProdutos(list);
      setLoading(false);
    });

    const qHist = query(collection(db, 'historico'), orderBy('data', 'desc'));
    const unsubHist = onSnapshot(qHist, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistorico(list);
    });

    return () => {
      unsubProd();
      unsubHist();
    };
  }, []);

  const cadastrarIniciais = async () => {
    for (const p of SEED_PRODUCTS) {
      await setDoc(doc(db, 'produtos', p.id), p);
    }
  };

  const handleMovimentar = async (e) => {
    e.preventDefault();
    if (!prodSel || !qtdMov || Number(qtdMov) <= 0) return;

    const prod = produtos.find(p => p.id === prodSel);
    if (!prod) return;

    const qtd = Number(qtdMov);
    const novaQtd = tipoMov === 'ENTRADA' ? (prod.qtdEstoque || 0) + qtd : (prod.qtdEstoque || 0) - qtd;

    if (novaQtd < 0) {
      alert("Quantidade em estoque insuficiente!");
      return;
    }

    await updateDoc(doc(db, 'produtos', prodSel), { qtdEstoque: novaQtd });
    await addDoc(collection(db, 'historico'), {
      produtoId: prodSel,
      produtoNome: prod.nome,
      tipo: tipoMov,
      quantidade: qtd,
      unidade: prod.unidade,
      observacao: obsMov,
      data: serverTimestamp()
    });

    setQtdMov('');
    setObsMov('');
    alert("Movimentação registrada!");
  };

  const handleAddProduto = async (e) => {
    e.preventDefault();
    if (!novoNome) return;

    await addDoc(collection(db, 'produtos'), {
      nome: novoNome.toUpperCase(),
      valorUnitario: Number(novoValor) || 0,
      minimo: Number(novoMinimo) || 3,
      unidade: novaUnidade,
      qtdEstoque: 0
    });

    setNovoNome('');
    setNovoValor('');
    alert("Produto cadastrado!");
  };

  const valorTotalEstoque = produtos.reduce((acc, p) => acc + ((p.qtdEstoque || 0) * (p.valorUnitario || 0)), 0);
  const totalItens = produtos.reduce((acc, p) => acc + (p.qtdEstoque || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-900 text-white flex flex-col items-center justify-center p-4">
        <Droplet className="w-12 h-12 animate-bounce text-emerald-300 mb-2" />
        <p className="text-lg font-medium">Conectando ao Firebase...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 pb-20">
      <header className="bg-emerald-800 text-white p-4 shadow-lg">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Droplet className="w-8 h-8 text-emerald-300" />
          <div>
            <h1 className="text-xl font-bold tracking-wide">CONTROLE DE ESTOQUE - AGROBRAZ</h1>
            <p className="text-xs text-emerald-200">Herbicidas & Defensivos (Nuvem Firebase)</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* RESUMO */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase">Valor em Estoque</p>
            <p className="text-xl font-extrabold text-emerald-700">{fmtBRL(valorTotalEstoque)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-bold uppercase">Total de Itens</p>
            <p className="text-xl font-extrabold text-amber-600">{totalItens} <span className="text-xs font-normal text-gray-500">itens</span></p>
          </div>
        </div>

        {/* ABA ESTOQUE */}
        {activeTab === 'estoque' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-600 uppercase">Quantidade em Estoque</h2>
              {produtos.length === 0 && (
                <button 
                  onClick={cadastrarIniciais} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Produtos Iniciais
                </button>
              )}
            </div>

            {produtos.length === 0 ? (
              <div className="bg-white p-8 rounded-xl text-center text-gray-400 border border-gray-200">
                <p className="text-sm mb-3">Nenhum produto cadastrado ainda no banco.</p>
                <button 
                  onClick={cadastrarIniciais} 
                  className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Clique para carregar 24D, Roundup, etc.
                </button>
              </div>
            ) : (
              produtos.map(p => {
                const alerta = (p.qtdEstoque || 0) <= (p.minimo || 3);
                return (
                  <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-800 text-base">{p.nome}</h3>
                      <p className="text-xs text-gray-500">Preço: {fmtBRL(p.valorUnitario)} / {p.unidade}</p>
                      {alerta && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1">
                          <AlertCircle className="w-3 h-3" /> Abaixo do mínimo ({p.minimo} {p.unidade})
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-black ${alerta ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {p.qtdEstoque || 0}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">{p.unidade}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ABA MOVIMENTAR */}
        {activeTab === 'movimentar' && (
          <form onSubmit={handleMovimentar} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="font-bold text-gray-700">Registrar Entrada / Saída</h2>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Produto</label>
              <select 
                value={prodSel} 
                onChange={e => setProdSel(e.target.value)} 
                className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm font-medium"
                required
              >
                <option value="">Selecione um produto...</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} (Atual: {p.qtdEstoque || 0} {p.unidade})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoMov('SAIDA')}
                className={`p-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border ${tipoMov === 'SAIDA' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-500'}`}
              >
                <MinusCircle className="w-4 h-4" /> Saída
              </button>
              <button
                type="button"
                onClick={() => setTipoMov('ENTRADA')}
                className={`p-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border ${tipoMov === 'ENTRADA' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500'}`}
              >
                <PlusCircle className="w-4 h-4" /> Entrada
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Quantidade</label>
              <input 
                type="number" 
                value={qtdMov} 
                onChange={e => setQtdMov(e.target.value)} 
                placeholder="Ex: 5" 
                className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Observação (Opcional)</label>
              <input 
                type="text" 
                value={obsMov} 
                onChange={e => setObsMov(e.target.value)} 
                placeholder="Ex: Aplicação Talhão 2" 
                className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
              />
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-sm shadow">
              Confirmar Movimentação
            </button>
          </form>
        )}

        {/* ABA PRODUTOS */}
        {activeTab === 'produtos' && (
          <form onSubmit={handleAddProduto} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h2 className="font-bold text-gray-700">Cadastrar Novo Produto</h2>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Nome do Produto</label>
              <input 
                type="text" 
                value={novoNome} 
                onChange={e => setNovoNome(e.target.value)} 
                placeholder="Ex: GLIFOSATO" 
                className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Valor Unitário (R$)</label>
                <input 
                  type="number" 
                  value={novoValor} 
                  onChange={e => setNovoValor(e.target.value)} 
                  placeholder="Ex: 45" 
                  className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Unidade</label>
                <select 
                  value={novaUnidade} 
                  onChange={e => setNovaUnidade(e.target.value)} 
                  className="w-full p-2.5 border rounded-lg bg-gray-50 text-sm"
                >
                  <option value="L">Litro (L)</option>
                  <option value="Kg">Quilo (Kg)</option>
                  <option value="gl">Galão (gl)</option>
                  <option value="UN">Unidade (UN)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-sm shadow">
              Salvar Produto
            </button>
          </form>
        )}

        {/* ABA HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-gray-600 uppercase">Últimas Movimentações</h2>
            {historico.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Nenhuma movimentação registrada.</p>
            ) : (
              historico.map(h => (
                <div key={h.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center text-xs">
                  <div>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] mr-2 ${h.tipo === 'ENTRADA' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {h.tipo}
                    </span>
                    <strong className="text-gray-800">{h.produtoNome}</strong>
                    {h.observacao && <p className="text-gray-400 mt-0.5">{h.observacao}</p>}
                  </div>
                  <div className="text-right font-bold text-gray-700">
                    {h.tipo === 'ENTRADA' ? '+' : '-'}{h.quantidade} {h.unidade}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* MENU INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 max-w-md mx-auto shadow-lg z-50">
        <button onClick={() => setActiveTab('estoque')} className={`flex flex-col items-center gap-1 ${activeTab === 'estoque' ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
          <Package className="w-5 h-5" />
          <span className="text-[10px]">Estoque</span>
        </button>
        <button onClick={() => setActiveTab('movimentar')} className={`flex flex-col items-center gap-1 ${activeTab === 'movimentar' ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px]">Movimentar</span>
        </button>
        <button onClick={() => setActiveTab('produtos')} className={`flex flex-col items-center gap-1 ${activeTab === 'produtos' ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px]">Produtos</span>
        </button>
        <button onClick={() => setActiveTab('historico')} className={`flex flex-col items-center gap-1 ${activeTab === 'historico' ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
          <History className="w-5 h-5" />
          <span className="text-[10px]">Histórico</span>
        </button>
      </nav>
    </div>
  );
}
