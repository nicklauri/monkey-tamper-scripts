const l = (...args) =>
  void (
    args.length &&
    console.log(`%c[onix-debug]%c ${args[0]}`, "font-weight; bold; color: teal;", "all: reset;", ...args.slice(1))
  )
const set = (item, value) => localStorage.setItem(`onix-debug.${item}`, JSON.stringify(value))
const get = (item) => JSON.parse(localStorage.getItem(`onix-debug.${item}`))
const getOr = (item, defaultValue) => get(item) ?? defaultValue
const getOrInit = (item, defaultValue) => {
  const result = get(item)
  if (!result) {
    set(item, defaultValue)
    return defaultValue
  }
  return result
}

// DEBUG:
window.gGetUrl = () => `https://localhost/OnixWork/Home/SwitchToCompany`

const sleepAsync = (duration) => new Promise((resolve) => setTimeout(() => resolve(), duration))

/**
 * @typedef {{ companyId: number, alias: string }} CompanyItem
 * @typedef {{
 *  open?: boolean,
 *  duration?: number,
 * }} AnimateElementOptions
 * @typedef {{
 *  spinner?: boolean,
 * } & AnimateElementOptions} OpenDialogOptions
 * @typedef {{
 *  id?: string,
 *  displayCloseAllBtn?: boolean,
 * } & OpenDialogOptions} MessageBoxOptions
 */

window._onix_debug = {
  /**
   * @param {HTMLElement} el Element to animate.
   * @param {AnimateElementOptions} param1 Animation options.
   */
  async animateElement(el, { duration, open } = { open: true }) {
    if (!el) {
      l(`could not animate element: no element was provided.`)
      return
    }

    duration ??= 200

    const transitioningState = open ? "showing" : "hiding"
    const transitioningDuration = open ? 0 : duration
    const transitionedState = open ? "show" : "hidden"
    const transitionedDuration = open ? duration : 0

    el.style.setProperty("--transition-duration", `${transitioningDuration}ms`)
    el.dataset.animation = transitioningState

    const delayToFullTransitioned = transitioningDuration + 50
    await sleepAsync(delayToFullTransitioned)

    el.style.setProperty("--transition-duration", `${transitionedDuration}ms`)
    el.dataset.animation = transitionedState
  },
  /**
   * @param {string} id Dialog HTML element's id.
   * @param {boolean} open Should open dialog.
   * @param {OpenDialogOptions} options Open dialog options.
   */
  async openDialog(id, open = true, options = { spinner: false }) {
    const mainDialogEl = document.getElementById(id)
    if (!mainDialogEl) {
      l(`could not open dialog: invalid dialog id:`, id)
      return
    }

    mainDialogEl.dataset.open = open

    const mainDlgContainerSelector = `#${id}>.odbg-dlg-container`
    const animateElSelector = options.spinner
      ? `#${id}>.odbg-dlg-container[data-component="spinner"]`
      : mainDlgContainerSelector

    const animateEl = document.querySelector(animateElSelector)
    if (!animateEl) {
      l(`could not open dialog: invalid dialog body:`, animateElSelector)
      return
    }

    options.spinner ? (mainDialogEl.dataset.component = "spinner") : delete mainDialogEl.dataset.component

    return await this.animateElement(animateEl, { ...options, open })
  },
  /**
   * @param {string} id Dialog HTML element's id.
   * @param {*} options
   */
  async closeDialog(id, options = {}) {
    return await this.openDialog(id, false, options)
  },
  msgBoxId: "odbg-message",
  /**
   * @param {string} msg Messagebox body message.
   * @param {string} title Messagebox title.
   * @param {MessageBoxOptions} options Messagebox options.
   */
  async openMessageBox(msg, title = "", options = {}) {
    const id = options.id ?? this.msgBoxId
    const msgBoxEl = document.getElementById(id)
    if (!msgBoxEl) {
      l(`could not find message box element, id:`, id)
      return
    }

    msgBoxEl.dataset.closeAllBtn = options.displayCloseAllBtn

    const msgBoxTitle = msgBoxEl.querySelector(".odbg-dlg-container>.header>.h-title")
    if (msgBoxTitle) {
      msgBoxTitle.textContent = title || "Message"
    }

    const msgBoxBody = msgBoxEl.querySelector(".odbg-message-content")
    if (msgBoxBody) {
      msgBoxBody.textContent = msg
    }

    return await this.openDialog(id, true, options)
  },
  async closeMessageBox(id, options = {}) {
    id ??= this.msgBoxId
    const msgBoxEl = document.getElementById(id)?.querySelector(".odbg-message-content")
    if (!msgBoxEl) {
      l(`could not find message box element, id:`, id)
      return
    }
    return await this.closeDialog(id, options)
  },
  switchCompanyDialogId: "odbg-switch-comp-dialog",
  async openSwitchCompanyDialog() {
    this.clearAllSelectedCompany()
    this.setCompanyInput("", "")
    this.renderCompanyTable()
    return await this.openDialog(this.switchCompanyDialogId)
  },
  async closeSwitchCompanyDialog() {
    return await this.closeDialog(this.switchCompanyDialogId)
  },
  async setSpinnerOpen(open = true) {
    return this.openDialog(this.msgBoxId, open, { spinner: true })
  },
  toggleReloadCurrentPage(event) {
    if (event) {
      event.stopPropagation()
      event.preventDefault()
    }

    const elId = "reload-current-page-checkbox"
    const el = document.getElementById(elId)
    if (!el) {
      l(`can't find elId: ${elId}`)
      return
    }

    el.classList.toggle("checked")
    this.isReloadCurrentPage = el.classList.contains("checked")
  },
  renderCompanyTable() {
    const tableBody = this.tableBody
    if (!tableBody) {
      l(`could not find company table body`)
      return
    }

    const compList = this.companyList

    const rowSelectedClass = (index) =>
      this.currentSelectedIdx >= 0 && index === this.currentSelectedIdx ? "selected" : ""

    const formatOne = (item, index) => `
  <tr class="${rowSelectedClass(index)}" onclick="window._onix_debug.selectCompanyEl(this)" data-company-id="${
      item.companyId
    }" data-idx=${index}>
    <td class="selection">
      <svg xmlns="http://www.w3.org/2000/svg" class="checkbox-icon" width="1em" height="1em" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        class="lucide lucide-check">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </td>
    <td>${item.companyId}</td>
    <td>${item.alias}</td>
    <td class="actions">
      <div class="odbg-group-ctrl">
      <button class="odbg-btn primary odbg-tooltip" onclick="window._onix_debug.switchToCompanyIdx(event, ${index})">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="lucide lucide-arrow-right-left">
          <path d="m16 3 4 4-4 4" />
          <path d="M20 7H4" />
          <path d="m8 21-4-4 4-4" />
          <path d="M4 17h16" />
        </svg>
        <div class="tooltip">Switch</div>
      </button>
      <button class="odbg-btn secondary odbg-tooltip" onclick="window._onix_debug.switchToCompanyAndReloadCurrentIdx(event, ${index})">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-refresh-ccw-dot"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><circle cx="12" cy="12" r="1"/></svg>
        <div class="tooltip">Switch reload</div>
      </button>
      </div>
    </td>
  </tr>`

    tableBody.innerHTML = compList.map(formatOne).join("\n")
  },
  isReloadCurrentPage: false,
  /** @type { number | null } */
  currentSelectedIdx: null,
  /** @typedef { const } */
  tableElId: "odbg-company-data-table",
  get tableEl() {
    return document.getElementById(this.tableElId)
  },
  get tableBody() {
    return this.tableEl?.querySelector("tbody")
  },
  get companyIdInput() {
    return document.getElementById("edit-company-id")
  },
  get companyAliasInput() {
    return document.getElementById("edit-company-alias")
  },
  setCompanyInput(companyId, alias) {
    this.companyIdInput.value = companyId
    this.companyAliasInput.value = alias
  },
  fillCompanyInputUsingEnvironmentVars() {},
  get companyList() {
    const testData = [
      { companyId: 42, alias: "Onix Test Leverandor" },
      { companyId: 43, alias: "Industrikunden" },
    ]

    /** @type { CompanyItem[] } */
    let list = get("company-list") ?? testData ?? []
    return list
  },
  get environmentCompanyInfo() {
    return {
      companyId: parseInt(window.gCommonVariables.CurrentCompanyId),
      alias: this.decodeHtml(window.gCommonVariables.CurrentCompanyName),
    }
  },
  /** @param {string} id */
  getCompanyById(id) {
    return this.companyList.find((item) => item.companyId === id)
  },
  /** @param {HTMLElement} el */
  selectCompanyEl(el) {
    const idx = parseInt(el.dataset.idx)
    this.selectCompany(idx)
  },
  clearAllSelectedCompany() {
    this.currentSelectedIdx = null
    this.tableEl?.querySelectorAll(`[data-idx].selected`).forEach((item) => item.classList.remove("selected"))
  },
  /** @param {number} idx */
  selectCompany(idx) {
    const company = this.companyList[idx]
    this.setCompanyInput(company?.companyId ?? "", company?.alias ?? "")

    if (this.currentSelectedIdx === idx) {
      return
    }

    this.clearAllSelectedCompany()
    this.currentSelectedIdx = company ? idx : null
    this.tableEl?.querySelector(`[data-idx="${this.currentSelectedIdx}"]`)?.classList.add("selected")
  },
  deleteCompany(idx) {
    this.setCompanyInput("", "")
    this.currentSelectedIdx = null

    this.renderCompanyTable()
  },
  updateCompany() {
    const idx = this.currentSelectedIdx
    if (!idx && idx !== 0) {
      this.openMessageBox("Please select a company first.", "Warning")
      return
    }

    const list = this.companyList

    const item = list?.[idx]
    if (item) {
      const companyId = this.companyIdInput.value
      const companyAlias = this.companyAliasInput.value

      if (Number.isInteger(Number(companyId))) {
        item.companyId = parseInt(companyId)
        item.alias = companyAlias?.trim() ?? ""

        this.saveCompanyList(list)
      }
    }

    this.renderCompanyTable()
  },
  async switchToCompanyIdx(event, idx, reloadAfterSwitching = false) {
    event.stopPropagation()
    event.preventDefault()
    const company = this.companyList[idx]
    if (!company) {
      this.openMessageBox(`switchToCompanyIdx: could not find index: ${idx}`, "Error")
      return
    }

    await this.setSpinnerOpen(true)
    const result = await this.doSwitchCompany(company)

    const message =
      result.isOk && !reloadAfterSwitching
        ? `Switched to company ${company.alias} (ID: ${company.companyId}).`
        : result.isOk && reloadAfterSwitching
        ? `Switched to company ${company.alias} (ID: ${company.companyId}). Reloading current page...`
        : result.error
        ? `Could not switch to company ${company.alias} (ID: ${company.companyId}), due to: ${
            result.error.message || result.error.toString()
          }`
        : `Failed to switch to company ${company.alias} (ID: ${company.companyId})`

    const title = result.isOk ? `Success` : `Error`

    await this.openMessageBox(message, title, { displayCloseAllBtn: true })

    if (result.isOk && reloadAfterSwitching) {
      // DEBUG
      // await sleepAsync(500)
      // END DEBUG
      // await this.closeMessageBox()
      return
    }
  },
  async switchToCompanyAndReloadCurrentIdx(event, idx) {
    return await this.switchToCompanyIdx(event, idx, true)
  },
  /** @param {CompanyItem[]} list  */
  saveCompanyList(list) {
    set("company-list", list)
  },
  addCompany() {
    const companyId = parseInt(this.companyIdInput.value || "")
    const companyAlias = this.companyAliasInput.value

    if (!companyId && companyId !== 0) {
      this.openMessageBox(`Invalid company ID.`, `Error`)
      return
    }

    const isCompanyIdExisted = this.companyList.some((item) => item.companyId === companyId)
    if (isCompanyIdExisted) {
      this.openMessageBox(`Company ID: ${companyId} is already existed.`, `Error`)
      return
    }

    const companyList = this.companyList
    companyList.push({ companyId, alias: companyAlias })
    this.saveCompanyList(companyList)
    this.setCompanyInput("", "")
    this.renderCompanyTable()
  },
  deleteSelectedCompany() {
    const companyList = this.companyList
    const selectedCompany = companyList[this.currentSelectedIdx]
    if (!selectedCompany) {
      this.openMessageBox("Must select a company first.", "Error")
      this.currentSelectedIdx = null
      return
    }

    this.saveCompanyList(companyList.filter((item) => item !== selectedCompany))
    this.renderCompanyTable()
  },
  switchCompanyUrl: window.gGetUrl("SwitchToCompany", "Home"),
  /** @return number */
  async doSwitchCompany(companyItem) {
    if (!companyItem?.companyId) {
      this.openMessageBox("Please select a company first.", "Error")
      return
    }

    try {
      // DEBUG:
      await sleepAsync(500)
      return { isOk: true }

      const result = await fetch(this.switchCompanyUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json; charset=UTF-8",
        },
        body: JSON.stringify({ companyId: companyItem.companyId }),
      })
      return { isOk: !!result.IsSuccessful, redirectTo: result.RedirectTo }
    } catch (error) {
      return { isOk: false, error }
    }
  },
  decodeHtml(string) {
    const el = document.createElement("span")
    el.innerHTML = string
    return el.childNodes[0].nodeValue
  },
}

setTimeout(() => {
  window._onix_debug.renderCompanyTable()
  // window._onix_debug.openMessageBox("Invalid company ID")
}, 0)
