<section className={styles.bottomLayoutGrid}>
            <article className={styles.card}>
              <div className={styles.cardTitle}>?? Cartas para Repasar</div>
              <div className={styles.miniCardsRowFlex}>
                {reviewCards.map((item) => (
                  <div key={`${item.symbol}-${item.status}`} className={styles.repasoNodeCard}>
                    <div className={styles.repasoCardSymbol}>{item.symbol}</div>
                    <span className={styles.statusIndicator}>
                      <i
                        className={`${styles.dot} ${item.tone === "danger" ? styles.dotRed : item.tone === "warning" ? styles.dotOrange : styles.dotGreen}`}
                      />
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnActionTrigger}>Ver todas las cartas</button>
            </article>

            <article className={styles.card}>
              <div className={styles.cardTitle}>? Accesos Rápidos</div>
              <div className={styles.quickActionsQuad}>
                {quickActions.map((action) => (
                  <div key={action.title} className={styles.actionNode}>
                    <h4>{action.title}</h4>
                    <p>{action.sub}</p>
                  </div>
                ))}
              </div>
              <button type="button" className={styles.btnActionTrigger}>Explorar Atajos</button>
            </article>

            <article className={styles.card}>
              <div className={styles.cardTitle}>? Mi Próximo Desafío</div>
              <div className={styles.challengeContainerBox}>
                <span className={styles.challengeSub}>Desafío Semanal</span>
                <h3>Interpretación Intuitiva</h3>
                <p className={styles.challengeDesc}>Realiza 5 tiradas intuitivas completas y registra tus impresiones.</p>
                <div className={styles.challengeProgressMeta}><span>Progreso</span><span>3 / 5</span></div>
                <div className={styles.challengeBarBg}><div className={styles.challengeBarFill} /></div>
              </div>
              <button type="button" className={styles.btnActionTrigger}>Ver desafíos</button>
            </article>
          </section>
