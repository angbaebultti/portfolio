import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const GRID_STEP = 5.5
const ROOM_WIDTH = 60
const ROOM_HEIGHT = 22
const ROOM_FRONT_Z = 12
const ROOM_BACK_Z = -80
const ROOM_DEPTH = ROOM_FRONT_Z - ROOM_BACK_Z
const ROOM_CENTER_Z = (ROOM_FRONT_Z + ROOM_BACK_Z) / 2

function makeGridGeometry(width: number, height: number, step: number) {
  const vertices: number[] = []
  const halfWidth = width / 2
  const halfHeight = height / 2

  for (let x = -halfWidth; x <= halfWidth + 0.001; x += step) {
    vertices.push(x, -halfHeight, 0, x, halfHeight, 0)
  }

  for (let y = -halfHeight; y <= halfHeight + 0.001; y += step) {
    vertices.push(-halfWidth, y, 0, halfWidth, y, 0)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  return geometry
}

function makeLineMaterial(color: number, opacity: number) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  })
}

function RoomFaces({
  floorGeometry,
  wallGeometry,
  material,
  offset = [0, 0, 0],
}: {
  floorGeometry: THREE.BufferGeometry
  wallGeometry: THREE.BufferGeometry
  material: THREE.LineBasicMaterial
  offset?: [number, number, number]
}) {
  return (
    <group position={offset}>
      <lineSegments
        geometry={floorGeometry}
        material={material}
        position={[0, 0, ROOM_CENTER_Z]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <lineSegments
        geometry={floorGeometry}
        material={material}
        position={[0, ROOM_HEIGHT, ROOM_CENTER_Z]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <lineSegments
        geometry={wallGeometry}
        material={material}
        position={[-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, ROOM_CENTER_Z]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <lineSegments
        geometry={wallGeometry}
        material={material}
        position={[ROOM_WIDTH / 2, ROOM_HEIGHT / 2, ROOM_CENTER_Z]}
        rotation={[0, -Math.PI / 2, 0]}
      />
    </group>
  )
}

export default function RetroRoom() {
  const {
    floorGeometry,
    wallGeometry,
    coreMaterial,
    glowMaterial,
    bloomMaterial,
    redMaterial,
    cyanMaterial,
    amberMaterial,
  } = useMemo(() => {
    return {
      floorGeometry: makeGridGeometry(ROOM_WIDTH, ROOM_DEPTH, GRID_STEP),
      wallGeometry: makeGridGeometry(ROOM_DEPTH, ROOM_HEIGHT, GRID_STEP),
      coreMaterial: makeLineMaterial(0xfff0ff, 1),
      glowMaterial: makeLineMaterial(0xff68df, 0.34),
      bloomMaterial: makeLineMaterial(0xa970ff, 0.18),
      redMaterial: makeLineMaterial(0xff4fbc, 0.18),
      cyanMaterial: makeLineMaterial(0x54e8ff, 0.2),
      amberMaterial: makeLineMaterial(0xffb468, 0.16),
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const flicker = 0.96 + Math.sin(t * 7.1) * 0.018 + Math.sin(t * 17.3) * 0.012
    coreMaterial.opacity = 0.99 + flicker * 0.045
    glowMaterial.opacity = 0.32 + Math.sin(t * 5.7) * 0.026
    bloomMaterial.opacity = 0.17 + Math.sin(t * 3.4) * 0.022
    amberMaterial.opacity = 0.15 + Math.sin(t * 4.9) * 0.018
    redMaterial.opacity = 0.16 + Math.sin(t * 6.3) * 0.014
    cyanMaterial.opacity = 0.18 + Math.sin(t * 6.9) * 0.016
  })

  return (
    <group>
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={bloomMaterial}
        offset={[0.18, -0.09, 0]}
      />
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={bloomMaterial}
        offset={[-0.18, 0.09, 0]}
      />
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={bloomMaterial}
        offset={[0, 0, 0.18]}
      />
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={glowMaterial}
      />
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={amberMaterial}
        offset={[0, 0.055, 0.035]}
      />
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={redMaterial}
        offset={[-0.065, 0.026, 0]}
      />
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={cyanMaterial}
        offset={[0.065, -0.026, 0]}
      />
      <RoomFaces
        floorGeometry={floorGeometry}
        wallGeometry={wallGeometry}
        material={coreMaterial}
      />
    </group>
  )
}
