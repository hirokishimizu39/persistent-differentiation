# Persistent Differentiation Zone

長期的にコモディティ化されない「永続的な差別化領域」を構築するためのプロジェクト。

## レイヤー構造

```
┌─────────────────────────────────────────────────────────────┐
│  Layer A1: Mind（思想の体系化）                               │
│  PPE + Psychology + History の統合フレームワーク              │
├─────────────────────────────────────────────────────────────┤
│  Layer A2: Body（身体の体系化）                               │
│  Structure + Nutrition + Movement + Recovery + Regulation   │
├─────────────────────────────────────────────────────────────┤
│  Layer B: 行動変容プロダクト（Execution Asset）               │
│  思想を動かすアプリを一貫して作り続ける                         │
├─────────────────────────────────────────────────────────────┤
│  Layer C: Tech × Human Layer（社会実装）                     │
│  人の成長・組織の文化形成を技術で再設計する能力                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Layer A1: Mind（思想の体系化）

```
        Philosophy（判断基準）
              ↓
   Psychology ←→ Economics
   （内面）      （インセンティブ）
         ↘    ↙
         Politics
         （権力）
              ↓
         History
         （文脈）
```

| # | Domain | 中心の問い | Resources |
|---|--------|-----------|-----------|
| 1 | [Philosophy & Thought](docs/knowledge-base/philosophy/) | 何が正しいか？ | 33 |
| 2 | [Psychology & Behavior](docs/knowledge-base/psychology-behavior/) | なぜそう動くか？ | 33 |
| 3 | [Economics & Incentives](docs/knowledge-base/economics-incentives/) | なぜそう選ぶか？ | 30 |
| 4 | [Politics & Power](docs/knowledge-base/politics-power/) | 誰が決定権を持つか？ | 33 |
| 5 | [History & Civilization](docs/knowledge-base/history-civilization/) | なぜそうなったか？ | 33 |

### 学習進捗サマリー

| Domain | 📚 Books | 🎬 Courses | 📄 Papers | Total |
|--------|----------|------------|-----------|-------|
| Philosophy & Thought | 0/15 | 0/10 | 0/8 | 0/33 |
| Psychology & Behavior | 0/15 | 0/8 | 0/10 | 0/33 |
| Economics & Incentives | 0/12 | 0/8 | 0/10 | 0/30 |
| Politics & Power | 0/15 | 0/8 | 0/10 | 0/33 |
| History & Civilization | 0/15 | 0/8 | 0/10 | 0/33 |
| **Total** | **0/72** | **0/42** | **0/48** | **0/162** |

---

## Layer A2: Body（身体の体系化）

```
        Structure（土台）
        解剖学・生理学
              ↓
    Nutrition ←→ Movement
    （入力）      （出力）
         ↘    ↙
         Recovery
         （回復）
              ↓
        Regulation
        （調整）
```

| # | Domain | 中心の問い | Resources |
|---|--------|-----------|-----------|
| 1 | [Structure](docs/knowledge-base/body-mastery/structure/) | 身体はどう構成されているか？ | 25 |
| 2 | [Nutrition](docs/knowledge-base/body-mastery/nutrition/) | 何をどう摂るか？ | 25 |
| 3 | [Movement](docs/knowledge-base/body-mastery/movement/) | どう動かすか？ | 25 |
| 4 | [Recovery](docs/knowledge-base/body-mastery/recovery/) | どう休むか？ | 24 |
| 5 | [Regulation](docs/knowledge-base/body-mastery/regulation/) | 内部はどう調整されるか？ | 24 |

### 学習進捗サマリー

| Domain | 📚 Books | 🎬 Courses | 📄 Papers | Total |
|--------|----------|------------|-----------|-------|
| Structure | 0/12 | 0/8 | 0/5 | 0/25 |
| Nutrition | 0/12 | 0/8 | 0/5 | 0/25 |
| Movement | 0/12 | 0/8 | 0/5 | 0/25 |
| Recovery | 0/12 | 0/8 | 0/4 | 0/24 |
| Regulation | 0/12 | 0/8 | 0/4 | 0/24 |
| **Total** | **0/60** | **0/40** | **0/23** | **0/123** |

---

## 学習ソースの基準

- **Books**: Nobel Prize受賞者、古典、大学標準教科書
- **Courses**: Harvard, Yale, MIT, Stanford, Oxford の正式講義
- **Papers**: Science, Nature, 各分野のトップジャーナル
- **Articles**: McKinsey, BCG, HBR, WEF のインサイト

---

## ディレクトリ構成

```
.
├── docs/
│   ├── knowledge-base/
│   │   ├── # Layer A1: Mind
│   │   ├── philosophy/              # 哲学・思想（33 resources）
│   │   ├── psychology-behavior/              # 心理・行動（33 resources）
│   │   ├── economics-incentives/              # 経済・インセンティブ（30 resources）
│   │   ├── politics-power/              # 政治・権力（33 resources）
│   │   ├── history-civilization/              # 歴史・文明（33 resources）
│   │   │
│   │   ├── # Layer A2: Body
│   │   ├── body-mastery/structure/              # 構造・機能（25 resources）
│   │   ├── body-mastery/nutrition/              # 栄養（25 resources）
│   │   ├── body-mastery/movement/              # 運動（25 resources）
│   │   ├── body-mastery/recovery/              # 回復（24 resources）
│   │   ├── body-mastery/regulation/              # 調整（24 resources）
│   │   │
│   │   └── frameworks/              # 統合フレームワーク
│   │
│   └── career-strategy/             # Layer C: キャリア戦略
│
└── apps/
    └── behavioral-tracker/          # Layer B: 行動変容プロダクト
```

---

## Layer B: 行動変容プロダクト

### 機能構成
1. 日次ログ（習慣・運動・学習）
2. 行動分析（AIによるパターン抽出）
3. 目標設定（Comfort Zone +5% モデル）
4. 読書・哲学ログ
5. 認知・気分状態のトラッキング
6. 理論に基づくフィードバック

### 原則
> 10個作る必要はない。
> "思想を動かすアプリ"を1本、ひたすら育て続ける。

---

## Layer C: Tech × Human Layer

### 学習領域
1. システム設計（DDD, Event-driven, Clean Architecture）
2. プロダクトマネジメント
3. AIシステムの倫理・実装
4. 教育工学・学習科学
5. 人材開発（HRTech）、組織行動論

### 目標
**「人の行動と組織文化に介入できる設計者」** になる。

---

## なぜこの構成か

| 領域 | AI時代に重要な理由 |
|------|-------------------|
| **Mind** | |
| 哲学・思想 | AIが答えを出せない「問いの立て方」を持てる |
| 心理・行動 | 人間を動かすのは人間の理解から |
| 経済 | インセンティブ設計で行動を変える |
| 政治・権力 | 意思決定構造と影響力を理解する |
| 歴史・文明 | パターン認識で未来を予測する |
| **Body** | |
| 構造 | 身体の仕組みを理解する土台 |
| 栄養 | 入力の最適化で基盤を作る |
| 運動 | 出力の最適化でパフォーマンスを上げる |
| 回復 | 休息の質が持続可能性を決める |
| 調整 | ホルモン・神経系で全体を統合 |

**Mind × Body を統合できる人材は、市場での代替可能性が極めて低い。**

---

## 学習記録

| Date | Domain | Resource | Type | Time | Key Takeaways |
|------|--------|----------|------|------|---------------|
| | | | | | |
